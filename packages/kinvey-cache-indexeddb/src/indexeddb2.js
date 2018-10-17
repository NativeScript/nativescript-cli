import sift from 'sift';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { nested } from './utils';

const DB_CACHE = {};

const IndexedDBTransactionMode = {
  readWrite: 'readwrite',
  readOnly: 'readonly',
};

class IndexedDB {
  constructor(dbName) {
    this.dbName = dbName;
    this.db = DB_CACHE[this.dbName];
    this.inTransaction = false;
    this.queue = [];
  }

  get db() {
    return this._db;
  }

  set db(db) {
    if (db) {
      this._db = db;
      DB_CACHE[this.dbName] = db;
    } else {
      this._db = null;
      delete DB_CACHE[this.dbName];
    }
  }

  hasObjectStore(objectStoreName) {
    if (this.db && this.db.objectStoreName) {
      return typeof this.db.objectStoreNames.contains === 'function'
        ? this.db.objectStoreNames.contains(objectStoreName)
        : this.db.objectStoreNames.indexOf(objectStoreName) !== -1;
    }

    return false;
  }

  openTransaction(objectStoreName, mode = IndexedDBTransactionMode.readOnly) {
    const txn = this.db.transaction(objectStoreName, mode);

    if (!txn) {
      throw new Error(`Unable to open a transaction for ${objectStoreName} collection on the ${this.dbName} IndexedDB database.`);
    }

    return txn;
  }

  openDB() {
    const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

    if (this.db) {
      const version = this.db.version + 1;
      this.close();
      return indexedDB.open(this.dbName, version);
    }

    return indexedDB.open(this.dbName);
  }

  open(objectStoreName, write = false, success, error, force = false) {
    try {
      if (this.db) {
        if (this.db.objectStoreNames.contains(objectStoreName)) {
          const mode = write ? IndexedDBTransactionMode.readWrite : IndexedDBTransactionMode.readOnly;
          return success(this.openTransaction(objectStoreName, mode));
        } else if (!write) {
          throw new Error(`The ${objectStoreName} collection was not found on the ${this.dbName} IndexedDB database.`);
        }
      }

      if (!force && this.inTransaction) {
        return this.queue.push(() => this.open(objectStoreName, write, success, error));
      }

      this.inTransaction = true;
      const request = this.openDB(objectStoreName);

      // If the database is opened with an higher version than its current, the
      // `upgradeneeded` event is fired. Save the handle to the database, and
      // create the collection.
      request.onupgradeneeded = (e) => {
        this.db = e.target.result;

        if (write && !this.db.objectStoreNames.contains(objectStoreName)) {
          this.db.createObjectStore(objectStoreName, { keyPath: '_id' });
        }
      };

      // The `success` event is fired after `upgradeneeded` terminates.
      // Save the handle to the database.
      request.onsuccess = (e) => {
        this.db = e.target.result;

        // If a second instance of the same IndexedDB database performs an
        // upgrade operation, the `versionchange` event is fired. Then, close the
        // database to allow the external upgrade to proceed.
        this.db.onversionchange = () => this.close();

        // Try to obtain the collection handle by recursing. Append the handlers
        // to empty the queue upon success and failure. Set the `force` flag so
        // all but the current transaction remain queued.
        const wrap = (done) => {
          const callbackFn = (arg) => {
            done(arg);

            // Switch flag
            this.inTransaction = false;

            // The database handle has been established, we can now safely empty
            // the queue. The queue must be emptied before invoking the concurrent
            // operations to avoid infinite recursion.
            if (this.queue.length > 0) {
              const pending = this.queue;
              this.queue = [];
              pending.forEach((fn) => {
                fn.call(this);
              });
            }
          };
          return callbackFn;
        };

        return this.open(objectStoreName, write, wrap(success), wrap(error), true);
      };

      // The `blocked` event is not handled. In case such an event occurs, it
      // will resolve itself since the `versionchange` event handler will close
      // the conflicting database and enable the `blocked` event to continue.
      request.onblocked = () => { };

      // Handle errors
      request.onerror = (e) => {
        error(new Error(`Unable to open the ${this.dbName} IndexedDB database. ${e.target.error.message}.`));
      };
    } catch (e) {
      error(e);
    }

    return null;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export async function find(dbName, objectStoreName, query) {
  const db = new IndexedDB(dbName);
  let docs = await new Promise((resolve, reject) => {
    db.open(objectStoreName, false, (txn) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.openCursor();
      const docs = [];

      request.onsuccess = (e) => {
        const cursor = e.target.result;

        if (cursor) {
          docs.push(cursor.value);
          return cursor.continue();
        }

        return resolve(docs);
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    }, (error) => {
      if (error.message.indexOf('not found') !== -1) {
        resolve([]);
      } else {
        reject(error);
      }
    });
  });

  if (query) {
    const {
      filter,
      sort,
      limit,
      skip,
      fields
    } = query;

    if (filter && !isEmpty(filter)) {
      docs = sift(filter, docs);
    }

    /* eslint-disable no-restricted-syntax, no-prototype-builtins  */
    if (sort) {
      docs.sort((a, b) => {
        for (const field in sort) {
          if (sort.hasOwnProperty(field)) {
            // Find field in objects.
            const aField = nested(a, field);
            const bField = nested(b, field);
            const modifier = sort[field]; // 1 (ascending) or -1 (descending).

            if ((aField !== null && typeof aField !== 'undefined')
              && (bField === null || typeof bField === 'undefined')) {
              return 1 * modifier;
            } else if ((bField !== null && typeof bField !== 'undefined')
              && (aField === null || typeof aField === 'undefined')) {
              return -1 * modifier;
            } else if (typeof aField === 'undefined' && bField === null) {
              return 0;
            } else if (aField === null && typeof bField === 'undefined') {
              return 0;
            } else if (aField !== bField) {
              return (aField < bField ? -1 : 1) * modifier;
            }
          }
        }

        return 0;
      });
    }
    /* eslint-enable no-restricted-syntax, no-prototype-builtins */

    if (skip > 0) {
      if (limit < Infinity) {
        docs = docs.slice(skip, skip + limit);
      } else {
        docs = docs.slice(skip);
      }
    }

    if (isArray(fields) && fields.length > 0) {
      docs = docs.map((doc) => {
        const keys = Object.keys(doc);
        keys.forEach((key) => {
          if (fields.indexOf(key) === -1) {
            // eslint-disable-next-line no-param-reassign
            delete doc[key];
          }
        });

        return doc;
      });
    }
  }

  return docs;
}

export async function count(dbName, objectStoreName, query) {
  const docs = await find(dbName, objectStoreName, query);
  return docs.length;
}

export function findById(dbName, objectStoreName, id) {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.open(objectStoreName, false, (txn) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.get(id);

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    }, reject);
  });
}

export async function save(dbName, objectStoreName, docs = []) {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.open(objectStoreName, true, (txn) => {
      const store = txn.objectStore(objectStoreName);

      docs.forEach((doc) => {
        store.put(doc);
      });

      txn.oncomplete = () => {
        resolve(docs);
      };

      txn.onerror = (e) => {
        reject(new Error(`An error occurred while saving the entities to the ${objectStoreName} collection on the ${this.dbName} IndexedDB database. ${e.target.error.message}.`));
      };
    }, reject);
  });
}

export async function removeById(dbName, objectStoreName, id) {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.oepn(objectStoreName, true, (txn) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.get(id);
      store.delete(id);

      txn.oncomplete = () => {
        const doc = request.result;

        if (doc) {
          resolve(1);
        } else {
          reject(new Error(`An entity with _id = ${id} was not found in the ${objectStoreName} collection on the ${this.dbName} database.`));
        }
      };

      txn.onerror = () => {
        reject(new Error(`An entity with _id = ${id} was not found in the ${objectStoreName} collection on the ${this.dbName} database.`));
      };
    }, reject);
  });
}

export async function remove(dbName, objectStoreName, query) {
  const docs = await find(dbName, objectStoreName, query);
  const results = await Promise.all(docs.map(doc => removeById(dbName, objectStoreName, doc._id)));
  return results.reduce((totalCount, { count }) => {
    return totalCount + count;
  }, 0);
}

export async function clear(dbName, objectStoreName) {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.open(objectStoreName, true, (txn) => {
      const objectStore = txn.objectStore(objectStoreName);
      objectStore.clear();
      txn.oncomplete = (result) => resolve(true);
      txn.onerror = (err) => reject(err);
    }, reject);
  });
}

export function clearAll(dbName) {
  return new Promise((resolve, reject) => {
    const indexedDB = global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB;
    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => {
      delete DB_CACHE[dbName];
      resolve();
    };

    request.onerror = (e) => {
      reject(new Error(`An error occurred while clearing the ${dbName} IndexedDB database. ${e.target.error.message}.`));
    };

    request.onblocked = () => {
      reject(new Error(`The ${dbName} IndexedDB database could not be cleared due to the operation being blocked.`));
    };
  });
}

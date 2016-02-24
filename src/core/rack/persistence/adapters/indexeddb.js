import { KinveyError, NotFoundError } from '../../../errors';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
let indexedDB = null;
const dbCache = {};

const TransactionMode = {
  ReadWrite: 'readwrite',
  ReadOnly: 'readonly',
};
Object.freeze(TransactionMode);

if (typeof window !== 'undefined') {
  require('indexeddbshim');
  global.shimIndexedDB.__useShim();
  indexedDB = global.indexedDB ||
              global.mozIndexedDB ||
              global.webkitIndexedDB ||
              global.msIndexedDB ||
              global.shimIndexedDB;
}

/**
 * @private
 */
export class IndexedDB {
  constructor(name = 'kinvey') {
    this.name = name;
    this.inTransaction = false;
    this.queue = [];
  }

  openTransaction(collection, write = false, success, error, force = false) {
    let db = dbCache[this.name];

    if (db) {
      if (db.objectStoreNames.contains(collection)) {
        try {
          const mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
          const txn = db.transaction([collection], mode);

          if (txn) {
            const store = txn.objectStore(collection);
            return success(store);
          }

          throw new KinveyError(`Unable to open a transaction for the ${collection} ` +
            `collection on the ${this.name} indexedDB database.`);
        } catch (err) {
          return error(err);
        }
      } else if (!write) {
        return error(new NotFoundError(`The ${collection} collection was not found on ` +
          `the ${this.name} indexedDB database.`));
      }
    }

    if (!force && this.inTransaction) {
      return this.queue.push(() => {
        this.openTransaction(collection, write, success, error);
      });
    }

    // Switch flag
    this.inTransaction = true;
    let request;

    if (db) {
      const version = db.version + 1;
      request = indexedDB.open(this.name, version);
    } else {
      request = indexedDB.open(this.name);
    }

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = e => {
      db = e.target.result;

      if (write) {
        db.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    // The `success` event is fired after `upgradeneeded` terminates.
    // Save the handle to the database.
    request.onsuccess = e => {
      db = e.target.result;
      dbCache[this.name] = db;

      // If a second instance of the same IndexedDB database performs an
      // upgrade operation, the `versionchange` event is fired. Then, close the
      // database to allow the external upgrade to proceed.
      db.onversionchange = () => {
        if (db) {
          db.close();
          db = null;
          dbCache[this.name] = null;
        }
      };

      // Try to obtain the collection handle by recursing. Append the handlers
      // to empty the queue upon success and failure. Set the `force` flag so
      // all but the current transaction remain queued.
      const wrap = done => {
        return arg => {
          done(arg);

          // Switch flag
          this.inTransaction = false;

          // The database handle has been established, we can now safely empty
          // the queue. The queue must be emptied before invoking the concurrent
          // operations to avoid infinite recursion.
          if (this.queue.length > 0) {
            const pending = this.queue;
            this.queue = [];
            forEach(pending, fn => {
              fn.call(this);
            });
          }
        };
      };

      this.openTransaction(collection, write, wrap(success), wrap(error), true);
    };

    request.onblocked = () => {
      error(new KinveyError(`The ${this.name} indexedDB database version can't be upgraded ` +
        `because the database is already open.`));
    };

    request.onerror = e => {
      error(new KinveyError(`Unable to open the ${this.name} indexedDB database. ` +
        `Received the error code ${e.target.errorCode}.`));
    };
  }

  find(collection) {
    const promise = new Promise((resolve, reject) => {
      if (!collection) {
        return reject(new KinveyError('A collection was not provided.'));
      }

      this.openTransaction(collection, false, store => {
        const request = store.openCursor();
        const response = [];

        request.onsuccess = function onSuccess(e) {
          const cursor = e.target.result;

          if (cursor) {
            response.push(cursor.value);
            return cursor.continue();
          }

          resolve(response);
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while fetching data from the ${collection} ` +
            `collection on the ${this.name} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, error => {
        if (error instanceof NotFoundError) {
          return resolve([]);
        }

        reject(error);
      });
    });

    return promise;
  }

  findById(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, false, store => {
        const request = store.get(id);

        request.onsuccess = (e) => {
          const entity = e.target.result;

          if (entity) {
            return resolve(entity);
          }

          reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} indexedDB database.`));
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while retrieving an entity with _id = ${id} ` +
            `from the ${collection} collection on the ${this.name} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, error => {
        if (error instanceof NotFoundError) {
          return reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} indexedDB database.`));
        }

        reject(error);
      });
    });

    return promise;
  }

  save(collection, entities) {
    if (!isArray(entities)) {
      return this.save(collection, entities);
    }

    if (entities.length === 0) {
      return Promise.resolve(entities);
    }

    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.transaction;

        forEach(entities, entity => {
          store.put(entity);
        });

        request.oncomplete = function onComplete() {
          resolve(entities);
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while saving the entities to the ${collection} ` +
            `collection on the ${this.name} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  removeById(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.transaction;
        const doc = store.get(id);
        store.delete(id);

        request.oncomplete = () => {
          if (!doc.result) {
            return reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection} `
              + `collection on the ${this.name} indexedDB database.`));
          }

          resolve({
            count: 1,
            entities: [doc.result]
          });
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while deleting an entity with id = ${id} ` +
            `in the ${collection} collection on the ${this.name} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  destroy() {
    const promise = new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const request = indexedDB.deleteDatabase(this.name);

      request.onsuccess = function onSuccess() {
        resolve(null);
      };

      request.onerror = (e) => {
        reject(new KinveyError(`An error occurred while destroying the ${this.name} ` +
          `indexedDB database. Received the error code ${e.target.errorCode}.`));
      };
    });

    return promise;
  }

  static isSupported() {
    return indexedDB ? true : false;
  }
}

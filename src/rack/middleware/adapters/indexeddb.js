import { KinveyError, NotFoundError } from '../../../errors';
import { Log } from '../../../log';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
let dbCache = {};

if (typeof window !== 'undefined') {
  require('indexeddbshim'); // eslint-disable-line global-require
}

const indexedDB = global.shimIndexedDB
                    || global.indexedDB
                    || global.webkitIndexedDB
                    || global.mozIndexedDB
                    || global.msIndexedDB;

const TransactionMode = {
  ReadWrite: 'readwrite',
  ReadOnly: 'readonly',
};
Object.freeze(TransactionMode);

/**
 * @private
 */
export default class IndexedDB {
  constructor(name) {
    if (!name) {
      throw new KinveyError('A name for the collection is required to use the indexeddb persistence adapter.', name);
    }

    if (!isString(name)) {
      throw new KinveyError(
        'The name of the collection must be a string to use the indexeddb persistence adapter', name);
    }

    this.name = name;
    this.inTransaction = false;
    this.queue = [];
  }

  openTransaction(collection, write = false, success, error, force = false) {
    let db = dbCache[this.name];

    if (db) {
      const containsCollection = isFunction(db.objectStoreNames.contains) ?
        db.objectStoreNames.contains(collection) : db.objectStoreNames.indexOf(collection) !== -1;

      if (containsCollection) {
        try {
          const mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
          const txn = db.transaction(collection, mode);

          if (txn) {
            return success(txn);
          }

          throw new KinveyError(`Unable to open a transaction for the ${collection}`
            + ` collection on the ${this.name} indexedDB database.`);
        } catch (err) {
          return error(err);
        }
      } else if (!write) {
        return error(new NotFoundError(`The ${collection} collection was not found on`
          + ` the ${this.name} indexedDB database.`));
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
      db.close();
      request = indexedDB.open(this.name, version);
    } else {
      request = indexedDB.open(this.name);
    }

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = e => {
      db = e.target.result;
      dbCache[this.name] = db;

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
        const callbackFn = arg => {
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
        return callbackFn;
      };

      return this.openTransaction(collection, write, wrap(success), wrap(error), true);
    };

    request.onblocked = () => {
      error(new KinveyError(`The ${this.name} indexedDB database version can't be upgraded ` +
        'because the database is already open.'));
    };

    request.onerror = e => {
      error(new KinveyError(`Unable to open the ${this.name} indexedDB database. ` +
        `${e.target.error.message}.`));
    };

    return request;
  }

  async find(collection) {
    return new Promise((resolve, reject) => {
      this.openTransaction(collection, false, async txn => {
        const store = txn.objectStore(collection);
        const request = store.openCursor();
        const entities = [];

        request.onsuccess = e => {
          const cursor = e.target.result;

          if (cursor) {
            entities.push(cursor.value);
            return cursor.continue();
          }

          return resolve(entities);
        };

        request.onerror = e => {
          Log.error(`An error occurred while trying to find entities for the ${collection} collection`
            + ` on the ${this.name} IndexedDB database. ${e.targer.error.message}.`);
          resolve([]);
        };
      }, reject);
    });
  }

  async findById(collection, id) {
    return new Promise((resolve, reject) => {
      this.openTransaction(collection, false, async txn => {
        const store = txn.objectStore(collection);
        const request = store.get(id);

        request.onsuccess = e => {
          const entity = e.target.result;

          if (entity) {
            resolve(entity);
          } else {
            reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
             + ` collection on the ${this.name} indexedDB database.`));
          }
        };

        request.onerror = () => {
          reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
             + ` collection on the ${this.name} indexedDB database.`));
        };
      }, reject);
    });
  }

  async save(collection, entities) {
    let singular = false;

    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    if (entities.length === 0) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.openTransaction(collection, true, async txn => {
        const store = txn.objectStore(collection);

        forEach(entities, entity => {
          store.put(entity);
        });

        txn.oncomplete = () => {
          resolve(singular ? entities[0] : entities);
        };

        txn.onerror = e => {
          reject(new KinveyError(`An error occurred while saving the entities to the ${collection}`
            + ` collection on the ${this.name} indexedDB database. ${e.target.error.message}.`));
        };
      }, reject);
    });
  }

  async removeById(collection, id) {
    return new Promise((resolve, reject) => {
      this.openTransaction(collection, true, async txn => {
        const store = txn.objectStore(collection);
        const request = store.get(id);
        store.delete(id);

        txn.oncomplete = () => {
          const entity = request.result;

          if (entity) {
            resolve(entity);
          } else {
            reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection}`
              + ` collection on the ${this.name} indexedDB database.`));
          }
        };

        txn.onerror = () => {
          reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection}`
              + ` collection on the ${this.name} indexedDB database.`));
        };
      }, reject);
    });
  }

  async clear() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);

      request.onsuccess = () => {
        dbCache = {};
        resolve();
      };

      request.onerror = (e) => {
        reject(new KinveyError(`An error occurred while clearing the ${this.name} indexedDB database.`
            + ` ${e.target.error.message}.`));
      };
    });
  }

  static isSupported() {
    return !!indexedDB;
  }
}

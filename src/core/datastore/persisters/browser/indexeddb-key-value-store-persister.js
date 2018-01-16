import { Promise } from 'es6-promise';
import { KinveyError, NotFoundError } from '../../../errors';

import { KeyValueStorePersister } from '../key-value-store-persister';
import { isDefined, ensureArray } from '../../../utils';
import { domStringListToStringArray, inedxedDbTransctionMode } from '../utils';

const dbCache = {}; // TODO: see what can be done about this

// TODO: all key/value stores are being reused as is, they need to be refactored
export class IndexedDbKeyValueStorePersister extends KeyValueStorePersister {
  constructor() {
    super();
    this.inTransaction = false;
    this.queue = [];
  }

  getKeys() {
    return this._getDb()
      .then((db) => domStringListToStringArray(db.objectStoreNames));
  }

  // protected methods

  _readFromPersistance(collection) {
    return new Promise((resolve, reject) => {
      this._openTransaction(collection, false, (txn) => {
        const store = txn.objectStore(collection);
        const request = store.openCursor();
        const entities = [];

        request.onsuccess = (e) => {
          const cursor = e.target.result;

          if (isDefined(cursor)) {
            entities.push(cursor.value);
            return cursor.continue();
          }

          return resolve(entities);
        };

        request.onerror = (e) => {
          reject(e);
        };
      }, (error) => {
        if (error instanceof NotFoundError) {
          resolve([]);
        }

        reject(error);
      });
    });
  }

  _writeToPersistance(collection, allEntities) {
    if (!allEntities) {
      return Promise.reject(new KinveyError('Invalid or missing entities array'));
    }

    return this._deleteFromPersistance(collection)
      .then(() => this._upsertEntities(collection, allEntities));
  }

  _deleteFromPersistance(collection) {
    // TODO: this should delete the object store, so it's excluded from the result of getKeys()
    // TODO: when should (if at all) we delete the entire database?
    return new Promise((resolve, reject) => {
      this._openTransaction(collection, true, (txn) => {
        const objStore = txn.objectStore(collection);
        objStore.clear();
        txn.oncomplete = (result) => resolve(result);
        txn.onerror = (err) => reject(err);
      }, reject);
    });
  }

  _readEntityFromPersistance(collection, entityId) {
    return new Promise((resolve, reject) => {
      this._openTransaction(collection, false, (txn) => {
        const store = txn.objectStore(collection);
        const request = store.get(entityId);

        request.onsuccess = (e) => {
          const entity = e.target.result;
          resolve(entity);
        };

        request.onerror = reject;
      }, reject);
    });
  }

  _writeEntitiesToPersistance(collection, entities) {
    return this._upsertEntities(collection, entities);
  }

  _deleteEntityFromPersistance(collection, entityId) {
    return new Promise((resolve, reject) => {
      this._openTransaction(collection, true, (txn) => {
        const store = txn.objectStore(collection);
        const request = store.get(entityId);
        store.delete(entityId);

        txn.oncomplete = () => {
          const entity = request.result;

          if (isDefined(entity)) {
            resolve({ count: 1 });
          } else {
            reject(this._getEntityNotFoundError(collection, entityId));
          }
        };

        txn.onerror = () => {
          reject(new NotFoundError(`An entity with id = ${entityId} was not found in the ${collection}`
            + ` collection on the ${this._storeName} IndexedDB database.`));
        };
      }, reject);
    });
  }

  // private methods

  _openTransaction(collection, write = false, success, error, force = false) {
    let db = dbCache[this._storeName];

    if (isDefined(db)) {
      const containsCollection = typeof db.objectStoreNames.contains === 'function' ?
        db.objectStoreNames.contains(collection) : db.objectStoreNames.indexOf(collection) !== -1;

      if (containsCollection) {
        try {
          const mode = write ? inedxedDbTransctionMode.readWrite : inedxedDbTransctionMode.readOnly;
          const txn = db.transaction(collection, mode);

          if (isDefined(txn)) {
            return success(txn);
          }

          throw new KinveyError(`Unable to open a transaction for ${collection}`
            + ` collection on the ${this._storeName} IndexedDB database.`);
        } catch (e) {
          return error(e);
        }
      } else if (write === false) {
        return error(new NotFoundError(`The ${collection} collection was not found on`
          + ` the ${this._storeName} IndexedDB database.`));
      }
    }

    if (force === false && this.inTransaction) {
      return this.queue.push(() => {
        this._openTransaction(collection, write, success, error);
      });
    }

    // Switch flag
    this.inTransaction = true;
    let request;

    try {
      request = this._openDb();
    } catch (e) {
      error(e);
    }

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      dbCache[this._storeName] = db;

      if (write === true) {
        db.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    // The `success` event is fired after `upgradeneeded` terminates.
    // Save the handle to the database.
    request.onsuccess = (e) => {
      db = e.target.result;
      dbCache[this._storeName] = db;

      // If a second instance of the same IndexedDB database performs an
      // upgrade operation, the `versionchange` event is fired. Then, close the
      // database to allow the external upgrade to proceed.
      db.onversionchange = () => {
        if (isDefined(db)) {
          db.close();
          db = null;
          dbCache[this._storeName] = null;
        }
      };

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

      return this._openTransaction(collection, write, wrap(success), wrap(error), true);
    };

    // The `blocked` event is not handled. In case such an event occurs, it
    // will resolve itself since the `versionchange` event handler will close
    // the conflicting database and enable the `blocked` event to continue.
    request.onblocked = () => { };

    // Handle errors
    request.onerror = (e) => {
      error(new Error(`Unable to open the ${this._storeName} IndexedDB database.`
        + ` ${e.target.error.message}.`));
    };

    return request;
  }

  _upsertEntities(collection, entities) {
    const singular = !Array.isArray(entities);
    entities = ensureArray(entities);

    if (entities.length === 0) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      this._openTransaction(collection, true, (txn) => {
        const store = txn.objectStore(collection);

        entities.forEach((entity) => {
          store.put(entity);
        });

        txn.oncomplete = () => {
          resolve(singular ? entities[0] : entities);
        };

        txn.onerror = (e) => {
          reject(new KinveyError(`An error occurred while saving the entities to the ${collection}`
            + ` collection on the ${this._storeName} IndexedDB database. ${e.target.error.message}.`));
        };
      }, reject);
    });
  }

  _getIndexedDbObj() {
    return global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB;
  }

  _openDb() {
    const db = dbCache[this._storeName];
    const indexedDb = this._getIndexedDbObj();

    if (isDefined(db)) {
      const version = db.version + 1;
      db.close();
      return indexedDb.open(this._storeName, version);
    }

    return indexedDb.open(this._storeName);
  }

  _getDb() {
    const db = dbCache[this._storeName];
    if (db) {
      return Promise.resolve(db);
    }
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        const db = e.target.result;
        resolve(db);
      };
      const openRequest = this._openDb();
      openRequest.onupgradeneeded = handler;
      openRequest.onsuccess = handler;
      openRequest.onerror = (err) => reject(err);
    });
  }
}

const KinveyError = require('../errors').KinveyError;
const NotFoundError = require('../errors').NotFoundError;
const generateObjectId = require('../utils/store').generateObjectId;
const forEach = require('lodash/collection/forEach');
const isArray = require('lodash/lang/isArray');
let indexedDB = undefined;
let db = null;
let inTransaction = false;
let queue = [];

if (typeof window !== 'undefined') {
  // Require indexeddbshim to patch buggy indexed db implementations
  require('indexeddbshim');
  window.shimIndexedDB.__useShim();
  indexedDB = window.indexedDB ||
              window.mozIndexedDB ||
              window.webkitIndexedDB ||
              window.msIndexedDB ||
              window.shimIndexedDB;
} else {
  indexedDB = require('fake-indexeddb');
}

class IndexedDB {
  constructor(dbName = 'kinvey') {
    this.dbName = dbName;
  }

  openTransaction(collection, write = false, success, error, force = false) {
    if (db && db.name === this.dbName) {
      if (db.objectStoreNames.indexOf(collection) !== -1) {
        try {
          const mode = write ? 'readwrite' : 'readonly';
          const txn = db.transaction([collection], mode);

          if (txn) {
            const store = txn.objectStore(collection);
            return success(store);
          }

          throw new KinveyError(`Unable to open a transaction for the ${collection} ` +
            `collection on the ${this.dbName} indexedDB database.`);
        } catch (err) {
          return error(err);
        }
      } else if (!write) {
        return error(new NotFoundError(`The ${collection} collection was not found on ` +
          `the ${this.dbName} indexedDB database.`));
      }
    }

    if (!force && inTransaction) {
      return queue.push(() => {
        this.openTransaction(collection, write, success, error);
      });
    }

    // Switch flag
    inTransaction = true;

    if (db && db.name !== this.dbName) {
      db.close();
      db = null;
    }

    let request;

    if (db) {
      const version = db.version + 1;
      db.close();
      request = indexedDB.open(this.dbName, version);
    } else {
      request = indexedDB.open(this.dbName);
    }

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = function onUpgradeNeeded(e) {
      db = e.target.result;

      if (write) {
        db.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    // The `success` event is fired after `upgradeneeded` terminates.
    // Save the handle to the database.
    request.onsuccess = (e) => {
      db = e.target.result;

      // If a second instance of the same IndexedDB database performs an
      // upgrade operation, the `versionchange` event is fired. Then, close the
      // database to allow the external upgrade to proceed.
      db.onversionchange = function onVersionChange() {
        if (db) {
          db.close();
          db = null;
        }
      };

      // Try to obtain the collection handle by recursing. Append the handlers
      // to empty the queue upon success and failure. Set the `force` flag so
      // all but the current transaction remain queued.
      const wrap = function wrap(done) {
        return function (arg) {
          done(arg);

          // Switch flag
          inTransaction = false;

          // The database handle has been established, we can now safely empty
          // the queue. The queue must be emptied before invoking the concurrent
          // operations to avoid infinite recursion.
          if (queue.length > 0) {
            const pending = queue;
            queue = [];
            forEach(pending, function (fn) {
              fn();
            });
          }
        };
      };

      this.openTransaction(collection, write, wrap(success), wrap(error), true);
    };

    request.onblocked = () => {
      error(new KinveyError(`The ${this.dbName} indexedDB database version can't be upgraded ` +
        `because the database is already open.`));
    };

    request.onerror = (e) => {
      error(new KinveyError(`Unable to open the ${this.dbName} indexedDB database. ` +
        `Received the error code ${e.target.errorCode}.`));
    };
  }

  find(collection) {
    const promise = new Promise((resolve, reject) => {
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
            `collection on the ${this.dbName} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  get(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, false, store => {
        const request = store.get(id);

        request.onsuccess = (e) => {
          const document = e.target.result;

          if (document) {
            return resolve(document);
          }

          reject(new NotFoundError(`A document with id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.dbName} indexedDB database.`));
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while retrieving a document with id = ${id} ` +
            `from the ${collection} collection on the ${this.dbName} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  save(collection, document) {
    if (isArray(document)) {
      return this.saveBulk(collection, document);
    }

    if (!document._id) {
      document._id = generateObjectId();
    }

    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.put(document);

        request.onsuccess = function onSuccess() {
          resolve(document);
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while saving a document to the ${collection} ` +
            `collection on the ${this.dbName} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  saveBulk(collection, documents) {
    if (!isArray(documents)) {
      return this.save(collection, document);
    }

    if (documents.length === 0) {
      return Promise.resolve(documents);
    }

    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.transaction;

        forEach(documents, document => {
          document._id = document._id || generateObjectId();
          store.put(document);
        });

        request.oncomplete = function onComplete() {
          resolve(documents);
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while saving the documents to the ${collection} ` +
            `collection on the ${this.dbName} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  remove(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.transaction;
        const document = store.get(id);
        store.delete(id);

        request.oncomplete = () => {
          if (!document.result) {
            return reject(new NotFoundError(`A document with id = ${id} was not found in the ${collection} `
              + `collection on the ${this.dbName} indexedDB database.`));
          }

          resolve({
            count: 1,
            documents: [document.result]
          });
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while deleting a document with id = ${id} ` +
            `in the ${collection} collection on the ${this.dbName} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  destroy() {
    const promise = new Promise((resolve, reject) => {
      if (db) {
        db.close();
        db = null;
      }

      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = function onSuccess() {
        resolve(null);
      };

      request.onerror = (e) => {
        reject(new KinveyError(`An error occurred while destroying the ${this.dbName} ` +
          `indexedDB database. Received the error code ${e.target.errorCode}.`));
      };
    });

    return promise;
  }

  static isSupported() {
    return indexedDB ? true : false;
  }
}

module.exports = IndexedDB;

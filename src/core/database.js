import KinveyError from './errors/error';
import cloneDeep from 'lodash/lang/cloneDeep';
import isString from 'lodash/lang/isString';
import isArray from 'lodash/lang/isArray';
let indexedDB = require(process.env.KINVEY_INDEXEDDB_LIB);

if (process.env.KINVEY_PLATFORM_ENV !== 'node') {
  indexedDB = global.shimIndexedDB || global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB;
}

class Database {
  get objectIdPrefix() {
    return 'local_';
  }

  constructor(name = 'Kinvey') {
    this.name = name;
    this.queue = [];
  }

  objectID(length = 24) {
    const chars = 'abcdef0123456789';
    let result = '';

    for (let i = 0, j = chars.length; i < length; i += 1) {
      const pos = Math.floor(Math.random() * j);
      result += chars.substring(pos, pos + 1);
    }

    return `${this.objectIdPrefix}${result}`;
  }

  transaction(collection, write = false, success, error, force = false) {
    // Validate collection argument.
    if (!isString(collection) || !/^[a-zA-Z0-9\-]{1,128}/.test(collection)) {
      return error(new KinveyError('The collection name has an invalid format.', `The collection name must be a string containing only alphanumeric characters and dashes, "${collection}" given.`));
    }

    // If there is a database handle, try to be smart.
    if (this.db && (force || !this.inTransaction)) {
      // If the collection exists, obtain and return the transaction handle.
      if (this.db.objectStoreNames.contains(collection)) {
        const mode = write ? 'readwrite' : 'readonly';
        let txn;

        try {
          txn = this.db.transaction([collection], mode);
        } catch (err) {
          return error(err);
        }

        // // A 'abort' event will fire when the transaction is aborted.
        // txn.onabort = () => {
        //   if (this.db) {
        //     this.db.close();
        //     this.db = null;
        //   }
        // };

        // // A 'timeout' event will fire when the transaction times out.
        // txn.ontimeout = () => {
        //   if (this.db) {
        //     this.db.close();
        //     this.db = null;
        //   }
        // };

        // // A 'complete' event will fire when the transaction is completed.
        // txn.oncomplete = () => {
        //   if (this.db) {
        //     this.db.close();
        //     this.db = null;
        //   }
        // };

        const store = txn.objectStore(collection);
        return success(store);
      } else if (!write) { // The collection does not exist. If we want to read only, return an error and do not create the collection.
        return error(new KinveyError(`${collection} was not found in this apps database.`)); // TODO: send CollectionNotFoundError
      }
    }

    // There is no database handle, or the collection needs to be created. Both
    // are done through a database upgrade operation. This operation cannot be
    // executed concurrently. Therefore, queue any concurrent operations.
    if (!force && this.inTransaction) {
      return this.queue.push(() => {
        this.transaction(collection, write, success, error, force);
      });
    }

    // Switch flag
    this.inTransaction = true;

    // An upgrade operation is initiated by re-opening the database with a
    // higher version number;
    let request;
    if (this.db) {
      const version = this.db.version + 1;
      this.db.close();
      request = indexedDB.open(this.name, version);
    } else { // Open the current version
      request = indexedDB.open(this.name);
    }

    // If an error occurs while trying to open the database, an 'error' event is fired.
    request.onerror = (evt) => {
      error(new KinveyError('Database error.', evt));
    };

    // A 'blocked' event will fire if the database is already open in another tab or window.
    request.onblocked = (evt) => {
      error(new KinveyError('Database is blocked.', evt));
    };

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      if (write) {
        db.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    // The `success` event is fired after `upgradeneeded` terminates. Again,
    // save the handle to the database.
    request.onsuccess = (evt) => {
      this.db = evt.target.result;

      // If a second instance of the same IndexedDB database performs an
      // upgrade operation, the `versionchange` event is fired. Close the
      // database to allow the external upgrade to proceed.
      this.db.onversionchange = () => {
        if (this.db) {
          this.db.close();
          this.db = null;
        }
      };

      // Try to obtain the collection handle by recursing. Append the handlers
      // to empty the queue upon success and failure. Set the `force` flag so
      // all but the current transaction remain queued.
      const wrap = (cb) => {
        return (arg) => {
          const result = cb(arg);

          // The database handle has been established, we can now safely empty
          // the queue. The queue must be emptied before invoking the concurrent
          // operations to avoid infinite recursion.
          this.inTransaction = false;
          if (this.queue.length) {
            const queue = this.queue;
            this.queue = [];
            queue.forEach(function(fn) { fn(); });
          }

          return result;
        };
      };

      // Try to obtain the collection handle by recursing. Append the handlers
      // to empty the queue upon success and failure. Set the `force` flag so
      // all but the current transaction remain queued.
      this.transaction(collection, write, wrap(success), wrap(error), true);
    };
  }

  fetch(collection, query) {
    const promise = new Promise((resolve, reject) => {
      this.transaction(collection, false, (store) => {
        const request = store.openCursor();
        const response = [];

        request.onsuccess = (evt) => {
          const cursor = evt.target.result;

          if (cursor) {
            response.push(cursor.value);
            cursor.continue();
          } else {
            resolve(response);
          }
        };

        request.onerror = (evt) => {
          reject(new KinveyError(null, evt));
        };
      }, (err) => {
        reject(err);
      });
    });

    return promise.then((response) => {
      if (!query) {
        return response;
      }

      // TODO: apply query
      return response;
    });
  }

  get() {
    return Promise.resolve(null);
  }

  save(collection, docs = []) {
    const singular = !isArray(docs);
    const promises = [];
    docs = singular ? [docs] : docs;

    for (let i = 0, len = docs.length; i < len; i++) {
      promises.push(new Promise((resolve, reject) => {
        const doc = cloneDeep(docs[i]);
        doc._id = doc._id || this.objectID();
        this.transaction(collection, true, (store) => {
          const request = store.put(doc);

          request.onsuccess = (doc) => {
            resolve(doc);
          };

          request.onerror = (evt) => {
            reject(new KinveyError('Database error.', evt));
          };
        }, (err) => {
          reject(err);
        });
      }));
    }

    return Promise.all(promises).then((result) => {
      if (singular) {
        return result[0];
      }

      return result;
    });
  }
}

export default Database;

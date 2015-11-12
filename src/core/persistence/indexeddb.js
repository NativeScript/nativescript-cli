const KinveyError = require('../errors').KinveyError;
const platform = require('../../utils/platform');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const isFunction = require('lodash/lang/isFunction');
const tableName = process.env.KINVEY_DATABASE_TABLE_NAME || 'data';
let pendingTransactions = [];
let inTransaction = false;
let indexedDB = undefined;

if (typeof window !== 'undefined') {
  indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: 'readwrite' };
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
}

class IndexedDB {
  constructor(app = 'kinvey') {
    this.app = app;
  }

  transaction(dbName, write = false, done, force = false) {
    if (this.db && (force || !inTransaction)) {
      if (this.db.objectStoreNames.contains(tableName)) {
        try {
          const mode = write ? 'readwrite' : 'readonly';
          const txn = this.db.transaction([tableName], mode);
          const store = txn.objectStore(tableName);
          done(null, store);
          return true;
        } catch (err) {
          done(err);
          return false;
        }
      } else if (!write) {
        done(new KinveyError(`The ${tableName} table was not found for this app backend.`));
        return false;
      }
    }

    if (!force && inTransaction) {
      pendingTransactions.push(() => {
        this.transaction(tableName, write, done);
      });
      return false;
    }

    let request;
    inTransaction = true;

    if (this.db) {
      const version = this.db.version + 1;
      this.db.close();
      request = indexedDB.open(dbName, version);
    } else {
      request = indexedDB.open(dbName);
    }

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (db.objectStoreNames.contains(tableName)) {
        db.deleteObjectStore(tableName);
      }

      if (!db.objectStoreNames.contains(tableName) && write) {
        var objectStore = db.createObjectStore(tableName, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('app', 'app', { unique: false });
        objectStore.createIndex('key', 'key', { unique: false });
        objectStore.createIndex('appkey', 'appkey', { unique: true });
      }
    };

    request.onsuccess = (e) => {
      this.db = e.target.result;

      this.db.onversionchange = () => {
        if (this.db) {
          this.db.onversionchange = null;
          this.db.close();
          this.db = null;
        }
      };

      const wrap = function(done) {
        return function(err, store) {
          done(err, store);
          inTransaction = false;

          if (pendingTransactions.length > 0) {
            const pending = pendingTransactions;
            pendingTransactions = [];
            forEach(pending, function(fn) {
              fn();
            });
          }
        };
      };

      this.transaction(tableName, write, wrap(done), true);
    };

    request.onerror = (e) => {
      throw e;
    };

    return false;
  }

  loadDatabase(dbName, callback) {
    this.getAppKey(this.app, dbName, result => {
      if (isFunction(callback)) {
        if (result.id === 0) {
          callback(null);
          return;
        }

        callback(result.val);
      } else {
        console.log(result.val);
      }
    });
  }

  getAppKey(app, key, callback) {
    const defaultResult = {
      id: 0,
      success: false
    };

    this.transaction(key, false, (err, store) => {
      if (err) {
        if (isFunction(callback)) {
          callback(defaultResult);
        }

        return;
      }

      const index = store.index('appkey');
      const appkey = `${app},${key}`;
      const request = index.get(appkey);

      request.onsuccess = function(e) {
        let result = e.target.result;

        if (!result) {
          result = defaultResult;
        }

        if (isFunction(callback)) {
          callback(result);
        } else {
          console.log(result);
        }
      };

      request.onerror = function(e) {
        if (isFunction(callback)) {
          callback(defaultResult);
        } else {
          throw e;
        }
      };
    });
  }

  saveDatabase(dbName, data, callback) {
    this.setAppKey(this.app, dbName, data, result => {
      if (result && result.success === true) {
        if (isFunction(callback)) {
          callback(null);
        }
      } else {
        if (isFunction(callback)) {
          callback(new KinveyError('Error saving the database.'));
        }
      }
    });
  }

  setAppKey(app, key, val, callback) {
    this.transaction(key, true, (err, store) => {
      const index = store.index('appkey');
      const appkey = `${app},${key}`;
      const request = index.get(appkey);

      request.onsuccess = function(e) {
        let result = e.target.result;

        if (!result) {
          result = {
            app: app,
            key: key,
            appkey: appkey,
            val: val
          };
        } else {
          result.val = val;
        }

        const requestPut = store.put(result);

        requestPut.onsuccess = function(e) {
          if (isFunction(callback)) {
            callback({ success: true });
          }
        };

        requestPut.onerror = function(e) {
          if (isFunction(callback)) {
            callback({ success: false });
          } else {
            console.error('IndexedDB.setAppKey (set) onerror');
            console.error(requestPut.error);
          }
        };
      };

      request.onerror = function(e) {
        if (isFunction(callback)) {
          callback({ success: false });
        } else {
          console.error('IndexedDB.setAppKey (set) onerror');
          console.error(request.error);
        }
      };
    });
  }

  static isSupported() {
    return indexedDB ? true : false;
  }
}

module.exports = IndexedDB;

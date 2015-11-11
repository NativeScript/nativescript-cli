const KinveyError = require('../errors').KinveyError;
const platform = require('../../utils/platform');
const indexedDB = platform.isNode() ? require('fake-indexeddb') : require('indexeddbshim');
const forEach = require('lodash/collection/forEach');
const isString = require('lodash/lang/isString');
const tableRegex = /^[a-zA-Z0-9\-]{1,128}/;
let pendingTransactions = [];
let inTransaction = false;

class IndexedDB {
  constructor(name = 'Kinvey') {
    this.name = name;
  }

  transaction(table, write = false, done, force = false) {
    if (!isString(table) || !tableRegex.test(table)) {
      return done(new KinveyError('The table name has an invalid format.', `The table name must be a string containing only alphanumeric characters and dashes, ${table} given.`));
    }

    if (this.db && (force || !inTransaction)) {
      if (this.db.objectStoreNames.contains(table)) {
        try {
          const mode = write ? 'readwrite' : 'readonly';
          const txn = this.db.transaction([table], mode);
          const store = txn.objectStore(table);
          done(null, store);
          return true;
        } catch (err) {
          done(err);
          return false;
        }
      } else if (!write) {
        done(new KinveyError('The table not found for this app backend.', table));
        return false;
      }
    }

    if (!force && inTransaction) {
      pendingTransactions.push(() => {
        this.transaction(table, write, done);
      });
      return false;
    }

    let request;

    if (this.db) {
      const version = this.db.version + 1;
      this.db.close();
      request = indexedDB.open(this.name, version);
    } else {
      request = indexedDB.open(this.name);
    }

    request.onupgradeneeded = () => {
      const db = request.result;

      if (write) {
        db.createObjectStore(table, { keyPath: '_id' });
      }
    };

    request.onsuccess = () => {
      this.db = request.result;

      this.db.onversionchange = () => {
        if (this.db) {
          this.db.close();
          this.db = null;
        }
      };

      const wrap = function(done) {
        return function(err, val) {
          done(err, val);
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

      this.transaction(table, write, wrap(done), true);
    };

    return false;
  }

  loadDatabase(name, done) {
    console.log('loadDatabase', name);
    done();
  }

  saveDatabase(name, data, done) {
    console.log('saveDatabase', name, data);
    done();
  }

  static isSupported() {
    return indexedDB ? true : false;
  }
}

module.exports = IndexedDB;

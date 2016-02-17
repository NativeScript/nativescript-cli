'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IndexedDB = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var indexedDB = null;
var dbCache = {};

var TransactionMode = {
  ReadWrite: 'readwrite',
  ReadOnly: 'readonly'
};
Object.freeze(TransactionMode);

if (typeof window !== 'undefined') {
  require('indexeddbshim');
  global.shimIndexedDB.__useShim();
  indexedDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB || global.shimIndexedDB;
}

/**
 * @private
 */

var IndexedDB = exports.IndexedDB = function () {
  function IndexedDB() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'kinvey' : arguments[0];

    _classCallCheck(this, IndexedDB);

    this.name = name;
    this.inTransaction = false;
    this.queue = [];
  }

  _createClass(IndexedDB, [{
    key: 'openTransaction',
    value: function openTransaction(collection) {
      var write = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
      var success = arguments[2];

      var _this = this;

      var error = arguments[3];
      var force = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

      var db = dbCache[this.name];

      if (db) {
        if (db.objectStoreNames.contains(collection)) {
          try {
            var mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
            var txn = db.transaction([collection], mode);

            if (txn) {
              var store = txn.objectStore(collection);
              return success(store);
            }

            throw new _errors.KinveyError('Unable to open a transaction for the ' + collection + ' ' + ('collection on the ' + this.name + ' indexedDB database.'));
          } catch (err) {
            return error(err);
          }
        } else if (!write) {
          return error(new _errors.NotFoundError('The ' + collection + ' collection was not found on ' + ('the ' + this.name + ' indexedDB database.')));
        }
      }

      if (!force && this.inTransaction) {
        return this.queue.push(function () {
          _this.openTransaction(collection, write, success, error);
        });
      }

      // Switch flag
      this.inTransaction = true;
      var request = undefined;

      if (db) {
        var version = db.version + 1;
        request = indexedDB.open(this.name, version);
      } else {
        request = indexedDB.open(this.name);
      }

      // If the database is opened with an higher version than its current, the
      // `upgradeneeded` event is fired. Save the handle to the database, and
      // create the collection.
      request.onupgradeneeded = function (e) {
        db = e.target.result;

        if (write) {
          db.createObjectStore(collection, { keyPath: '_id' });
        }
      };

      // The `success` event is fired after `upgradeneeded` terminates.
      // Save the handle to the database.
      request.onsuccess = function (e) {
        db = e.target.result;
        dbCache[_this.name] = db;

        // If a second instance of the same IndexedDB database performs an
        // upgrade operation, the `versionchange` event is fired. Then, close the
        // database to allow the external upgrade to proceed.
        db.onversionchange = function () {
          if (db) {
            db.close();
            db = null;
            dbCache[_this.name] = null;
          }
        };

        // Try to obtain the collection handle by recursing. Append the handlers
        // to empty the queue upon success and failure. Set the `force` flag so
        // all but the current transaction remain queued.
        var wrap = function wrap(done) {
          return function (arg) {
            done(arg);

            // Switch flag
            _this.inTransaction = false;

            // The database handle has been established, we can now safely empty
            // the queue. The queue must be emptied before invoking the concurrent
            // operations to avoid infinite recursion.
            if (_this.queue.length > 0) {
              var pending = _this.queue;
              _this.queue = [];
              (0, _forEach2.default)(pending, function (fn) {
                fn.call(_this);
              });
            }
          };
        };

        _this.openTransaction(collection, write, wrap(success), wrap(error), true);
      };

      request.onblocked = function () {
        error(new _errors.KinveyError('The ' + _this.name + ' indexedDB database version can\'t be upgraded ' + 'because the database is already open.'));
      };

      request.onerror = function (e) {
        error(new _errors.KinveyError('Unable to open the ' + _this.name + ' indexedDB database. ' + ('Received the error code ' + e.target.errorCode + '.')));
      };
    }
  }, {
    key: 'find',
    value: function find(collection) {
      var _this2 = this;

      var promise = new Promise(function (resolve, reject) {
        if (!collection) {
          return reject(new _errors.KinveyError('A collection was not provided.'));
        }

        _this2.openTransaction(collection, false, function (store) {
          var request = store.openCursor();
          var response = [];

          request.onsuccess = function onSuccess(e) {
            var cursor = e.target.result;

            if (cursor) {
              response.push(cursor.value);
              return cursor.continue();
            }

            resolve(response);
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while fetching data from the ' + collection + ' ' + ('collection on the ' + _this2.name + ' indexedDB database. Received the error code ' + e.target.errorCode + '.')));
          };
        }, function (error) {
          if (error instanceof _errors.NotFoundError) {
            return resolve([]);
          }

          reject(error);
        });
      });

      return promise;
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      var _this3 = this;

      var promise = new Promise(function (resolve, reject) {
        _this3.openTransaction(collection, false, function (store) {
          var request = store.get(id);

          request.onsuccess = function (e) {
            var entity = e.target.result;

            if (entity) {
              return resolve(entity);
            }

            reject(new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this3.name + ' indexedDB database.')));
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while retrieving an entity with _id = ' + id + ' ' + ('from the ' + collection + ' collection on the ' + _this3.name + ' indexedDB database. ') + ('Received the error code ' + e.target.errorCode + '.')));
          };
        }, function (error) {
          if (error instanceof _errors.NotFoundError) {
            return reject(new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this3.name + ' indexedDB database.')));
          }

          reject(error);
        });
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save(collection, entities) {
      var _this4 = this;

      if (!(0, _isArray2.default)(entities)) {
        return this.save(collection, entities);
      }

      if (entities.length === 0) {
        return Promise.resolve(entities);
      }

      var promise = new Promise(function (resolve, reject) {
        _this4.openTransaction(collection, true, function (store) {
          var request = store.transaction;

          (0, _forEach2.default)(entities, function (entity) {
            store.put(entity);
          });

          request.oncomplete = function onComplete() {
            resolve(entities);
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while saving the entities to the ' + collection + ' ' + ('collection on the ' + _this4.name + ' indexedDB database. Received the error code ' + e.target.errorCode + '.')));
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this5 = this;

      var promise = new Promise(function (resolve, reject) {
        _this5.openTransaction(collection, true, function (store) {
          var request = store.transaction;
          var doc = store.get(id);
          store.delete(id);

          request.oncomplete = function () {
            if (!doc.result) {
              return reject(new _errors.NotFoundError('An entity with id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this5.name + ' indexedDB database.')));
            }

            resolve({
              count: 1,
              entities: [doc.result]
            });
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while deleting an entity with id = ' + id + ' ' + ('in the ' + collection + ' collection on the ' + _this5.name + ' indexedDB database. ') + ('Received the error code ' + e.target.errorCode + '.')));
          };
        }, reject);
      });

      return promise;
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this6 = this;

      var promise = new Promise(function (resolve, reject) {
        if (_this6.db) {
          _this6.db.close();
          _this6.db = null;
        }

        var request = indexedDB.deleteDatabase(_this6.name);

        request.onsuccess = function onSuccess() {
          resolve(null);
        };

        request.onerror = function (e) {
          reject(new _errors.KinveyError('An error occurred while destroying the ' + _this6.name + ' ' + ('indexedDB database. Received the error code ' + e.target.errorCode + '.')));
        };
      });

      return promise;
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return indexedDB ? true : false;
    }
  }]);

  return IndexedDB;
}();
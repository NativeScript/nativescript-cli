'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _idbFactory = require('idb-factory');

var _idbRequest = require('idb-request');

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var indexedDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB;

var TransactionMode = {
  ReadWrite: 'readwrite',
  ReadOnly: 'readonly'
};
Object.freeze(TransactionMode);

/**
 * @private
 */

var IndexedDB = function () {
  function IndexedDB(name) {
    _classCallCheck(this, IndexedDB);

    if (!name) {
      throw new _errors.KinveyError('A name for the collection is required to use the indexeddb persistence adapter.', name);
    }

    if (!(0, _isString2.default)(name)) {
      throw new _errors.KinveyError('The name of the collection must be a string to use the indexeddb persistence adapter', name);
    }

    this.name = name;
  }

  _createClass(IndexedDB, [{
    key: 'createTransaction',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(collection) {
        var write = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        var db, mode, txn;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _idbFactory.open)(name, 1, function (e) {
                  if (e.oldVersion < 1) {
                    e.target.result.createObjectStore(collection, { keyPath: '_id' });
                  }
                });

              case 2:
                db = _context.sent;
                mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
                txn = db.transaction([collection], mode);
                return _context.abrupt('return', txn);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createTransaction(_x, _x2) {
        return ref.apply(this, arguments);
      }

      return createTransaction;
    }()
  }, {
    key: 'find',
    value: function find(collection) {
      var _this = this;

      var promise = new Promise(function (resolve, reject) {
        if (!collection) {
          return reject(new _errors.KinveyError('A collection was not provided.'));
        }

        return _this.openTransaction(collection, false, function (store) {
          var request = store.openCursor();
          var response = [];

          request.onsuccess = function (e) {
            var cursor = e.target.result;

            if (cursor) {
              response.push(cursor.value);
              return cursor.continue();
            }

            return resolve(response);
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while fetching data from the ' + collection + ' ' + ('collection on the ' + _this.name + ' indexedDB database. Received the error code ' + e.target.errorCode + '.')));
          };
        }, function (error) {
          if (error instanceof _errors.NotFoundError) {
            return resolve([]);
          }

          return reject(error);
        });
      });

      return promise;
    }
  }, {
    key: 'findById',
    value: function findById(collection, id) {
      var _this2 = this;

      var promise = new Promise(function (resolve, reject) {
        _this2.openTransaction(collection, false, function (store) {
          var request = store.get(id);

          request.onsuccess = function (e) {
            var entity = e.target.result;

            if (entity) {
              return resolve(entity);
            }

            return reject(new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this2.name + ' indexedDB database.')));
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while retrieving an entity with _id = ' + id + ' ' + ('from the ' + collection + ' collection on the ' + _this2.name + ' indexedDB database. ') + ('Received the error code ' + e.target.errorCode + '.')));
          };
        }, function (error) {
          if (error instanceof _errors.NotFoundError) {
            return reject(new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this2.name + ' indexedDB database.')));
          }

          return reject(error);
        });
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save(collection, entities) {
      var promise = this.createTransaction(collection, true).then(function (txn) {
        var store = txn.objectStore(collection);
        var singular = false;

        if (!(0, _isArray2.default)(entities)) {
          singular = true;
          entities = [entities];
        }

        var promises = (0, _map2.default)(entities, function (entity) {
          return (0, _idbRequest.request)(store.put(entity));
        });
        promises.push((0, _idbRequest.requestTransaction)(txn));

        return Promise.all(promises).then(function (results) {
          return singular ? results[0] : results;
        });
      });

      return promise;
    }
  }, {
    key: 'removeById',
    value: function removeById(collection, id) {
      var _this3 = this;

      var promise = new Promise(function (resolve, reject) {
        _this3.openTransaction(collection, true, function (store) {
          var request = store.transaction;
          var doc = store.get(id);
          store.delete(id);

          request.oncomplete = function () {
            if (!doc.result) {
              return reject(new _errors.NotFoundError('An entity with id = ' + id + ' was not found in the ' + collection + ' ' + ('collection on the ' + _this3.name + ' indexedDB database.')));
            }

            return resolve(doc.result);
          };

          request.onerror = function (e) {
            reject(new _errors.KinveyError('An error occurred while deleting an entity with id = ' + id + ' ' + ('in the ' + collection + ' collection on the ' + _this3.name + ' indexedDB database. ') + ('Received the error code ' + e.target.errorCode + '.')));
          };
        }, reject);
      });

      return promise;
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return !!indexedDB;
    }
  }]);

  return IndexedDB;
}();

exports.default = IndexedDB;
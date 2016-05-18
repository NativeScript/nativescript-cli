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

if (typeof window !== 'undefined') {
  require('indexeddbshim'); // eslint-disable-line global-require
  global.forceIndexedDB = global.shimIndexedDB;
}

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
                return (0, _idbFactory.open)(this.name, 1, function (e) {
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(collection) {
        var txn, store, request, response;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.createTransaction(collection);

              case 2:
                txn = _context2.sent;
                store = txn.objectStore(collection);
                request = store.openCursor();
                response = [];
                _context2.next = 8;
                return (0, _idbRequest.requestCursor)(request, function (cursor) {
                  response.push(cursor.value);
                  cursor.continue();
                });

              case 8:
                return _context2.abrupt('return', response);

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function find(_x4) {
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(collection, id) {
        var txn, store, request, entity;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.createTransaction(collection);

              case 2:
                txn = _context3.sent;
                store = txn.objectStore(collection);
                request = store.get(id);
                entity = undefined;
                _context3.next = 8;
                return (0, _idbRequest.requestCursor)(request, function (item, stop) {
                  entity = item;
                  stop();
                });

              case 8:
                _context3.next = 10;
                return (0, _idbRequest.requestTransaction)(txn);

              case 10:
                return _context3.abrupt('return', entity);

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function findById(_x5, _x6) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(collection, entities) {
        var txn, store, singular, promises;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.createTransaction(collection, true);

              case 2:
                txn = _context4.sent;
                store = txn.objectStore(collection);
                singular = false;


                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                promises = (0, _map2.default)(entities, function (entity) {
                  return (0, _idbRequest.request)(store.put(entity));
                });

                promises.push((0, _idbRequest.requestTransaction)(txn));
                _context4.next = 10;
                return Promise.all(promises);

              case 10:
                return _context4.abrupt('return', singular ? entities[0] : entities);

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function save(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(collection, id) {
        var txn, store, request, entity;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.createTransaction(collection, true);

              case 2:
                txn = _context5.sent;
                store = txn.objectStore(collection);
                request = store.get(id);
                entity = undefined;
                _context5.next = 8;
                return (0, _idbRequest.requestCursor)(request, function (item, stop) {
                  entity = item;
                  stop();
                });

              case 8:
                if (!entity) {
                  _context5.next = 12;
                  break;
                }

                store.delete(id);
                _context5.next = 12;
                return (0, _idbRequest.requestTransaction)(txn);

              case 12:
                return _context5.abrupt('return', entity);

              case 13:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function removeById(_x9, _x10) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      var indexedDB = global.focedIndexedDB || global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB || global.shimIndexedDB;
      return !!indexedDB;
    }
  }]);

  return IndexedDB;
}();

exports.default = IndexedDB;
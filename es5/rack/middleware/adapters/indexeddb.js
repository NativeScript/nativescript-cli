'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../../../errors');

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var dbCache = {};

if (typeof window !== 'undefined') {
  require('indexeddbshim'); // eslint-disable-line global-require
}

var indexedDB = global.shimIndexedDB || global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB;

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
        var containsCollection = (0, _isFunction2.default)(db.objectStoreNames.contains) ? db.objectStoreNames.contains(collection) : db.objectStoreNames.indexOf(collection) !== -1;

        if (containsCollection) {
          try {
            var mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
            var txn = db.transaction(collection, mode);

            if (txn) {
              return success(txn);
            }

            throw new _errors.KinveyError('Unable to open a transaction for the ' + collection + (' collection on the ' + this.name + ' indexedDB database.'));
          } catch (err) {
            return error(err);
          }
        } else if (!write) {
          return error(new _errors.NotFoundError('The ' + collection + ' collection was not found on' + (' the ' + this.name + ' indexedDB database.')));
        }
      }

      if (!force && this.inTransaction) {
        return this.queue.push(function () {
          _this.openTransaction(collection, write, success, error);
        });
      }

      // Switch flag
      this.inTransaction = true;
      var request = void 0;

      if (db) {
        var version = db.version + 1;
        db.close();
        request = indexedDB.open(this.name, version);
      } else {
        request = indexedDB.open(this.name);
      }

      // If the database is opened with an higher version than its current, the
      // `upgradeneeded` event is fired. Save the handle to the database, and
      // create the collection.
      request.onupgradeneeded = function (e) {
        db = e.target.result;
        dbCache[_this.name] = db;

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
          var callbackFn = function callbackFn(arg) {
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
          return callbackFn;
        };

        return _this.openTransaction(collection, write, wrap(success), wrap(error), true);
      };

      request.onblocked = function () {
        error(new _errors.KinveyError('The ' + _this.name + ' indexedDB database version can\'t be upgraded ' + 'because the database is already open.'));
      };

      request.onerror = function (e) {
        error(new _errors.KinveyError('Unable to open the ' + _this.name + ' indexedDB database. ' + (e.target.error.message + '.')));
      };

      return request;
    }
  }, {
    key: 'find',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(collection) {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  _this2.openTransaction(collection, false, function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(txn) {
                      var store, request, entities;
                      return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              store = txn.objectStore(collection);
                              request = store.openCursor();
                              entities = [];


                              request.onsuccess = function (e) {
                                var cursor = e.target.result;

                                if (cursor) {
                                  entities.push(cursor.value);
                                  return cursor.continue();
                                }

                                return resolve(entities);
                              };

                              request.onerror = function (e) {
                                reject(new _errors.KinveyError('An error occurred while fetching data from the ' + collection + (' collection on the ' + _this2.name + ' indexedDB database. ' + e.target.error.message)));
                              };

                            case 5:
                            case 'end':
                              return _context.stop();
                          }
                        }
                      }, _callee, _this2);
                    }));

                    return function (_x4) {
                      return ref.apply(this, arguments);
                    };
                  }(), reject);
                }));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function find(_x3) {
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(collection, id) {
        var _this3 = this;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', new Promise(function (resolve, reject) {
                  _this3.openTransaction(collection, false, function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(txn) {
                      var store, request;
                      return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              store = txn.objectStore(collection);
                              request = store.get(id);


                              request.onsuccess = function (e) {
                                var entity = e.target.result;

                                if (entity) {
                                  resolve(entity);
                                } else {
                                  reject(new _errors.NotFoundError('An entity with _id = ' + id + ' was not found in the ' + collection + (' collection on the ' + _this3.name + ' indexedDB database.')));
                                }
                              };

                              request.onerror = function (e) {
                                reject(new _errors.KinveyError('An error occurred while retrieving an entity with _id = ' + id + (' from the ' + collection + ' collection on the ' + _this3.name + ' indexedDB database.') + (' ' + e.target.error.message + '.')));
                              };

                            case 4:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this3);
                    }));

                    return function (_x7) {
                      return ref.apply(this, arguments);
                    };
                  }(), reject);
                }));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findById(_x5, _x6) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(collection, entities) {
        var _this4 = this;

        var singular;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                singular = false;


                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                if (!(entities.length === 0)) {
                  _context6.next = 4;
                  break;
                }

                return _context6.abrupt('return', null);

              case 4:
                return _context6.abrupt('return', new Promise(function (resolve, reject) {
                  _this4.openTransaction(collection, true, function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(txn) {
                      var store;
                      return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              store = txn.objectStore(collection);


                              (0, _forEach2.default)(entities, function (entity) {
                                store.put(entity);
                              });

                              txn.oncomplete = function () {
                                resolve(singular ? entities[0] : entities);
                              };

                              txn.onerror = function (e) {
                                reject(new _errors.KinveyError('An error occurred while saving the entities to the ' + collection + (' collection on the ' + _this4.name + ' indexedDB database. ' + e.target.error.message + '.')));
                              };

                            case 4:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, _this4);
                    }));

                    return function (_x10) {
                      return ref.apply(this, arguments);
                    };
                  }(), reject);
                }));

              case 5:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function save(_x8, _x9) {
        return ref.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(collection, id) {
        var _this5 = this;

        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', new Promise(function (resolve, reject) {
                  _this5.openTransaction(collection, true, function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(txn) {
                      var store, request;
                      return regeneratorRuntime.wrap(function _callee7$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              store = txn.objectStore(collection);
                              request = store.get(id);

                              store.delete(id);

                              txn.oncomplete = function () {
                                var entity = request.result;

                                if (entity) {
                                  resolve(entity);
                                } else {
                                  reject(new _errors.NotFoundError('An entity with id = ' + id + ' was not found in the ' + collection + (' collection on the ' + _this5.name + ' indexedDB database.')));
                                }
                              };

                              txn.onerror = function (e) {
                                reject(new _errors.KinveyError('An error occurred while deleting an entity with id = ' + id + (' in the ' + collection + ' collection on the ' + _this5.name + ' indexedDB database.') + (' ' + e.target.error.message + '.')));
                              };

                            case 5:
                            case 'end':
                              return _context7.stop();
                          }
                        }
                      }, _callee7, _this5);
                    }));

                    return function (_x13) {
                      return ref.apply(this, arguments);
                    };
                  }(), reject);
                }));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function removeById(_x11, _x12) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
        var _this6 = this;

        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', new Promise(function (resolve, reject) {
                  var request = indexedDB.deleteDatabase(_this6.name);

                  request.onsuccess = function () {
                    resolve();
                  };

                  request.onerror = function (e) {
                    reject(new _errors.KinveyError('An error occurred while clearing the ' + _this6.name + ' indexedDB database.' + (' ' + e.target.error.message + '.')));
                  };
                }));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function clear() {
        return ref.apply(this, arguments);
      }

      return clear;
    }()
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return !!indexedDB;
    }
  }]);

  return IndexedDB;
}();

exports.default = IndexedDB;
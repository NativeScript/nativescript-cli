"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.find = find;
exports.count = count;
exports.findById = findById;
exports.save = save;
exports.removeById = removeById;
exports.clear = clear;
exports.clearAll = clearAll;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var DB_CACHE = {};
var IndexedDBTransactionMode = {
  readWrite: 'readwrite',
  readOnly: 'readonly'
};

var IndexedDB =
/*#__PURE__*/
function () {
  function IndexedDB(dbName) {
    (0, _classCallCheck2.default)(this, IndexedDB);
    this.dbName = dbName;
    this.db = DB_CACHE[this.dbName];
    this.inTransaction = false;
    this.queue = [];
  }

  (0, _createClass2.default)(IndexedDB, [{
    key: "hasObjectStore",
    value: function hasObjectStore(objectStoreName) {
      if (this.db && this.db.objectStoreName) {
        return typeof this.db.objectStoreNames.contains === 'function' ? this.db.objectStoreNames.contains(objectStoreName) : this.db.objectStoreNames.indexOf(objectStoreName) !== -1;
      }

      return false;
    }
  }, {
    key: "openTransaction",
    value: function openTransaction(objectStoreName) {
      var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : IndexedDBTransactionMode.readOnly;
      var txn = this.db.transaction(objectStoreName, mode);

      if (!txn) {
        throw new Error("Unable to open a transaction for ".concat(objectStoreName, " collection on the ").concat(this.dbName, " IndexedDB database."));
      }

      return txn;
    }
  }, {
    key: "openDB",
    value: function openDB() {
      var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

      if (this.db) {
        var version = this.db.version + 1;
        this.close();
        return indexedDB.open(this.dbName, version);
      }

      return indexedDB.open(this.dbName);
    }
  }, {
    key: "open",
    value: function open(objectStoreName) {
      var _this = this;

      var write = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var success = arguments.length > 2 ? arguments[2] : undefined;
      var error = arguments.length > 3 ? arguments[3] : undefined;
      var force = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

      try {
        if (this.db) {
          if (this.db.objectStoreNames.contains(objectStoreName)) {
            var mode = write ? IndexedDBTransactionMode.readWrite : IndexedDBTransactionMode.readOnly;
            return success(this.openTransaction(objectStoreName, mode));
          } else if (!write) {
            throw new Error("The ".concat(objectStoreName, " collection was not found on the ").concat(this.dbName, " IndexedDB database."));
          }
        }

        if (!force && this.inTransaction) {
          return this.queue.push(function () {
            return _this.open(objectStoreName, write, success, error);
          });
        }

        this.inTransaction = true;
        var request = this.openDB(objectStoreName); // If the database is opened with an higher version than its current, the
        // `upgradeneeded` event is fired. Save the handle to the database, and
        // create the collection.

        request.onupgradeneeded = function (e) {
          _this.db = e.target.result;

          if (write && !_this.db.objectStoreNames.contains(objectStoreName)) {
            _this.db.createObjectStore(objectStoreName, {
              keyPath: '_id'
            });
          }
        }; // The `success` event is fired after `upgradeneeded` terminates.
        // Save the handle to the database.


        request.onsuccess = function (e) {
          _this.db = e.target.result; // If a second instance of the same IndexedDB database performs an
          // upgrade operation, the `versionchange` event is fired. Then, close the
          // database to allow the external upgrade to proceed.

          _this.db.onversionchange = function () {
            return _this.close();
          }; // Try to obtain the collection handle by recursing. Append the handlers
          // to empty the queue upon success and failure. Set the `force` flag so
          // all but the current transaction remain queued.


          var wrap = function wrap(done) {
            var callbackFn = function callbackFn(arg) {
              done(arg); // Switch flag

              _this.inTransaction = false; // The database handle has been established, we can now safely empty
              // the queue. The queue must be emptied before invoking the concurrent
              // operations to avoid infinite recursion.

              if (_this.queue.length > 0) {
                var pending = _this.queue;
                _this.queue = [];
                pending.forEach(function (fn) {
                  fn.call(_this);
                });
              }
            };

            return callbackFn;
          };

          return _this.open(objectStoreName, write, wrap(success), wrap(error), true);
        }; // The `blocked` event is not handled. In case such an event occurs, it
        // will resolve itself since the `versionchange` event handler will close
        // the conflicting database and enable the `blocked` event to continue.


        request.onblocked = function () {}; // Handle errors


        request.onerror = function (e) {
          error(new Error("Unable to open the ".concat(_this.dbName, " IndexedDB database. ").concat(e.target.error.message, ".")));
        };
      } catch (e) {
        error(e);
      }

      return null;
    }
  }, {
    key: "close",
    value: function close() {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }
  }, {
    key: "db",
    get: function get() {
      return this._db;
    },
    set: function set(db) {
      if (db) {
        this._db = db;
        DB_CACHE[this.dbName] = db;
      } else {
        this._db = null;
        delete DB_CACHE[this.dbName];
      }
    }
  }]);
  return IndexedDB;
}();

function find(dbName, objectStoreName) {
  var db = new IndexedDB(dbName);
  return new Promise(function (resolve, reject) {
    db.open(objectStoreName, false, function (txn) {
      var store = txn.objectStore(objectStoreName);
      var request = store.openCursor();
      var docs = [];

      request.onsuccess = function (e) {
        var cursor = e.target.result;

        if (cursor) {
          docs.push(cursor.value);
          return cursor.continue();
        }

        return resolve(docs);
      };

      request.onerror = function (e) {
        reject(e.target.error);
      };
    }, function (error) {
      if (error.message.indexOf('not found') !== -1) {
        resolve([]);
      } else {
        reject(error);
      }
    });
  });
}

function count(_x, _x2) {
  return _count.apply(this, arguments);
}

function _count() {
  _count = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(dbName, objectStoreName) {
    var db;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            db = new IndexedDB(dbName);
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              db.open(objectStoreName, false, function (txn) {
                var store = txn.objectStore(objectStoreName);
                var request = store.count();

                request.onsuccess = function () {
                  return resolve(request.result);
                };

                request.onerror = function (e) {
                  return reject(e.target.error);
                };
              }, function (error) {
                if (error.message.indexOf('not found') !== -1) {
                  resolve(0);
                } else {
                  reject(error);
                }
              });
            }));

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _count.apply(this, arguments);
}

function findById(dbName, objectStoreName, id) {
  var db = new IndexedDB(dbName);
  return new Promise(function (resolve, reject) {
    db.open(objectStoreName, false, function (txn) {
      var store = txn.objectStore(objectStoreName);
      var request = store.get(id);

      request.onsuccess = function (e) {
        resolve(e.target.result);
      };

      request.onerror = function (e) {
        reject(e.target.error);
      };
    }, reject);
  });
}

function save(_x3, _x4) {
  return _save.apply(this, arguments);
}

function _save() {
  _save = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(dbName, objectStoreName) {
    var _this2 = this;

    var docs,
        db,
        _args2 = arguments;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            docs = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : [];
            db = new IndexedDB(dbName);
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              db.open(objectStoreName, true, function (txn) {
                var store = txn.objectStore(objectStoreName);
                var docsToSave = docs;

                if (!Array.isArray(docs)) {
                  docsToSave = [docs];
                }

                docsToSave.forEach(function (doc) {
                  store.put(doc);
                });

                txn.oncomplete = function () {
                  resolve(docs);
                };

                txn.onerror = function (e) {
                  reject(new Error("An error occurred while saving the entities to the ".concat(objectStoreName, " collection on the ").concat(_this2.dbName, " IndexedDB database. ").concat(e.target.error.message, ".")));
                };
              }, reject);
            }));

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _save.apply(this, arguments);
}

function removeById(_x5, _x6, _x7) {
  return _removeById.apply(this, arguments);
}

function _removeById() {
  _removeById = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(dbName, objectStoreName, id) {
    var _this3 = this;

    var db;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            db = new IndexedDB(dbName);
            return _context3.abrupt("return", new Promise(function (resolve, reject) {
              db.open(objectStoreName, true, function (txn) {
                var store = txn.objectStore(objectStoreName);
                var request = store.get(id);
                store.delete(id);

                txn.oncomplete = function () {
                  var doc = request.result;

                  if (doc) {
                    resolve(1);
                  } else {
                    reject(new Error("An entity with _id = ".concat(id, " was not found in the ").concat(objectStoreName, " collection on the ").concat(_this3.dbName, " database.")));
                  }
                };

                txn.onerror = function () {
                  reject(new Error("An entity with _id = ".concat(id, " was not found in the ").concat(objectStoreName, " collection on the ").concat(_this3.dbName, " database.")));
                };
              }, reject);
            }));

          case 2:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _removeById.apply(this, arguments);
}

function clear(_x8, _x9) {
  return _clear.apply(this, arguments);
}

function _clear() {
  _clear = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(dbName, objectStoreName) {
    var db;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            db = new IndexedDB(dbName);
            return _context4.abrupt("return", new Promise(function (resolve, reject) {
              db.open(objectStoreName, true, function (txn) {
                var objectStore = txn.objectStore(objectStoreName);
                objectStore.clear();

                txn.oncomplete = function () {
                  return resolve(true);
                };

                txn.onerror = function (err) {
                  return reject(err);
                };
              }, reject);
            }));

          case 2:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _clear.apply(this, arguments);
}

function clearAll(dbName) {
  return new Promise(function (resolve, reject) {
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = function () {
      delete DB_CACHE[dbName];
      resolve(true);
    };

    request.onerror = function (e) {
      reject(new Error("An error occurred while clearing the ".concat(dbName, " IndexedDB database. ").concat(e.target.error.message, ".")));
    };

    request.onblocked = function () {
      reject(new Error("The ".concat(dbName, " IndexedDB database could not be cleared due to the operation being blocked.")));
    };
  });
}
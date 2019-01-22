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

var _lokijs = _interopRequireDefault(require("lokijs"));

var memAdapter = new _lokijs.default.LokiMemoryAdapter();

function open(dbName, collectionName) {
  return new Promise(function (resolve, reject) {
    var db = new _lokijs.default(dbName, {
      adapter: memAdapter,
      autosave: false,
      autoload: true,
      autoloadCallback: function autoloadCallback(error) {
        if (error) {
          reject(error);
        } else {
          if (collectionName) {
            var collection = db.getCollection(collectionName);

            if (!collection) {
              collection = db.addCollection(collectionName, {
                clone: true,
                unique: ['_id'],
                disableMeta: true
              });
            }
          }

          resolve(db);
        }
      }
    });
  });
}

function find(_x, _x2) {
  return _find.apply(this, arguments);
}

function _find() {
  _find = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(dbName, collectionName) {
    var db, collection;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return open(dbName, collectionName);

          case 2:
            db = _context.sent;
            collection = db.getCollection(collectionName);
            return _context.abrupt("return", collection.chain().data({
              removeMeta: true
            }));

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _find.apply(this, arguments);
}

function count(_x3, _x4) {
  return _count.apply(this, arguments);
}

function _count() {
  _count = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(dbName, collectionName) {
    var docs;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return find(dbName, collectionName);

          case 2:
            docs = _context2.sent;
            return _context2.abrupt("return", docs.length);

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _count.apply(this, arguments);
}

function findById(_x5, _x6, _x7) {
  return _findById.apply(this, arguments);
}

function _findById() {
  _findById = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(dbName, collectionName, id) {
    var db, collection, doc;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return open(dbName, collectionName);

          case 2:
            db = _context3.sent;
            collection = db.getCollection(collectionName);
            doc = collection.by('_id', id);

            if (doc) {
              delete doc.$loki;
            }

            return _context3.abrupt("return", doc);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _findById.apply(this, arguments);
}

function save(_x8, _x9, _x10) {
  return _save.apply(this, arguments);
}

function _save() {
  _save = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(dbName, collectionName, docsToSaveOrUpdate) {
    var db, collection, docs;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return open(dbName, collectionName);

          case 2:
            db = _context4.sent;
            collection = db.getCollection(collectionName);
            docs = docsToSaveOrUpdate;

            if (docs) {
              _context4.next = 7;
              break;
            }

            return _context4.abrupt("return", null);

          case 7:
            docs = docs.map(function (doc) {
              var savedDoc = collection.by('_id', doc._id);

              if (savedDoc) {
                savedDoc = Object.assign({
                  $loki: savedDoc.$loki
                }, doc);
                collection.update(savedDoc);
                return savedDoc;
              }

              collection.insert(doc);
              return doc;
            });
            return _context4.abrupt("return", new Promise(function (resolve, reject) {
              db.save(function (error) {
                if (error) {
                  return reject(error);
                }

                return resolve(docs);
              });
            }));

          case 9:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _save.apply(this, arguments);
}

function removeById(_x11, _x12, _x13) {
  return _removeById.apply(this, arguments);
}

function _removeById() {
  _removeById = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(dbName, collectionName, id) {
    var db, collection, doc, removedDoc;
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return open(dbName, collectionName);

          case 2:
            db = _context5.sent;
            collection = db.getCollection(collectionName);
            doc = collection.by('_id', id);

            if (!doc) {
              _context5.next = 9;
              break;
            }

            removedDoc = collection.remove(doc);

            if (!removedDoc) {
              _context5.next = 9;
              break;
            }

            return _context5.abrupt("return", new Promise(function (resolve, reject) {
              db.save(function (error) {
                if (error) {
                  return reject(error);
                }

                return resolve(1);
              });
            }));

          case 9:
            return _context5.abrupt("return", 0);

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return _removeById.apply(this, arguments);
}

function clear(_x14, _x15) {
  return _clear.apply(this, arguments);
}

function _clear() {
  _clear = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(dbName, collectionName) {
    var db, collection;
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return open(dbName, collectionName);

          case 2:
            db = _context6.sent;
            collection = db.getCollection(collectionName);
            collection.clear();
            return _context6.abrupt("return", new Promise(function (resolve, reject) {
              db.save(function (error) {
                if (error) {
                  return reject(error);
                }

                return resolve(true);
              });
            }));

          case 6:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));
  return _clear.apply(this, arguments);
}

function clearAll(_x16) {
  return _clearAll.apply(this, arguments);
}

function _clearAll() {
  _clearAll = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee7(dbName) {
    var db;
    return _regenerator.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return open(dbName);

          case 2:
            db = _context7.sent;
            return _context7.abrupt("return", new Promise(function (resolve, reject) {
              db.deleteDatabase(function (error) {
                if (error) {
                  return reject(error);
                }

                return resolve(true);
              });
            }));

          case 4:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));
  return _clearAll.apply(this, arguments);
}
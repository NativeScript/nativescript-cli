"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clear = clear;
exports.Cache = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _pQueue = _interopRequireDefault(require("p-queue"));

var _query = _interopRequireDefault(require("../query"));

var _aggregation = _interopRequireDefault(require("../aggregation"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _utils = require("./utils");

var _store = require("./store");

var queue = new _pQueue.default({
  concurrency: 1
});

var Cache =
/*#__PURE__*/
function () {
  function Cache(storeName, collectionName) {
    (0, _classCallCheck2.default)(this, Cache);
    this.storeName = storeName;
    this.collectionName = collectionName;
    this.store = (0, _store.get)();
  }

  (0, _createClass2.default)(Cache, [{
    key: "find",
    value: function find(query) {
      var _this = this;

      return queue.add(
      /*#__PURE__*/
      (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee() {
        var docs;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _this.store.find(_this.storeName, _this.collectionName);

              case 2:
                docs = _context.sent;

                if (!(query && !(query instanceof _query.default))) {
                  _context.next = 5;
                  break;
                }

                throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

              case 5:
                if (!(docs.length > 0 && query)) {
                  _context.next = 7;
                  break;
                }

                return _context.abrupt("return", query.process(docs));

              case 7:
                return _context.abrupt("return", docs);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      })));
    }
  }, {
    key: "group",
    value: function () {
      var _group = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(aggregation) {
        var docs;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (aggregation instanceof _aggregation.default) {
                  _context2.next = 2;
                  break;
                }

                throw new _kinvey.default('Invalid aggregation. It must be an instance of the Aggregation class.');

              case 2:
                _context2.next = 4;
                return this.find();

              case 4:
                docs = _context2.sent;
                return _context2.abrupt("return", aggregation.process(docs));

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function group(_x) {
        return _group.apply(this, arguments);
      }

      return group;
    }()
  }, {
    key: "reduce",
    value: function reduce(aggregation) {
      return this.group(aggregation);
    }
  }, {
    key: "count",
    value: function () {
      var _count = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(query) {
        var _this2 = this;

        var docs;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!query) {
                  _context3.next = 5;
                  break;
                }

                _context3.next = 3;
                return this.find(query);

              case 3:
                docs = _context3.sent;
                return _context3.abrupt("return", docs.length);

              case 5:
                return _context3.abrupt("return", queue.add(function () {
                  return _this2.store.count(_this2.storeName, _this2.collectionName);
                }));

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function count(_x2) {
        return _count.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: "findById",
    value: function findById(id) {
      var _this3 = this;

      return queue.add(function () {
        return _this3.store.findById(_this3.storeName, _this3.collectionName, id);
      });
    }
  }, {
    key: "save",
    value: function save(docs) {
      var _this4 = this;

      return queue.add(
      /*#__PURE__*/
      (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4() {
        var docsToSave, singular;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                docsToSave = docs;
                singular = false;

                if (docs) {
                  _context4.next = 4;
                  break;
                }

                return _context4.abrupt("return", null);

              case 4:
                if (!Array.isArray(docs)) {
                  singular = true;
                  docsToSave = [docs];
                } // Clone the docs


                docsToSave = docsToSave.slice(0, docsToSave.length); // Save the docs

                if (!(docsToSave.length > 0)) {
                  _context4.next = 11;
                  break;
                }

                docsToSave = docsToSave.map(function (doc) {
                  if (!doc._id) {
                    return Object.assign({}, {
                      _id: (0, _utils.generateId)(),
                      _kmd: Object.assign({}, doc._kmd, {
                        local: true
                      })
                    }, doc);
                  }

                  return doc;
                });
                _context4.next = 10;
                return _this4.store.save(_this4.storeName, _this4.collectionName, docsToSave);

              case 10:
                return _context4.abrupt("return", singular ? docsToSave.shift() : docsToSave);

              case 11:
                return _context4.abrupt("return", docs);

              case 12:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      })));
    }
  }, {
    key: "remove",
    value: function () {
      var _remove = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(query) {
        var _this5 = this;

        var docs, results;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.find(query);

              case 2:
                docs = _context5.sent;

                if (!query) {
                  _context5.next = 8;
                  break;
                }

                _context5.next = 6;
                return Promise.all(docs.map(function (doc) {
                  return _this5.removeById(doc._id);
                }));

              case 6:
                results = _context5.sent;
                return _context5.abrupt("return", results.reduce(function (totalCount, count) {
                  return totalCount + count;
                }, 0));

              case 8:
                _context5.next = 10;
                return this.clear();

              case 10:
                return _context5.abrupt("return", docs.length);

              case 11:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function remove(_x3) {
        return _remove.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: "removeById",
    value: function removeById(id) {
      var _this6 = this;

      return queue.add(function () {
        return _this6.store.removeById(_this6.storeName, _this6.collectionName, id);
      });
    }
  }, {
    key: "clear",
    value: function clear() {
      var _this7 = this;

      return queue.add(function () {
        return _this7.store.clear(_this7.storeName, _this7.collectionName);
      });
    }
  }]);
  return Cache;
}();

exports.Cache = Cache;

function clear(storeName) {
  var store = (0, _store.get)();
  return queue.add(function () {
    return store.clearAll(storeName);
  });
}
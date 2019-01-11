"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.queryToSyncQuery = queryToSyncQuery;
exports.Sync = exports.SyncEvent = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _query = _interopRequireDefault(require("../query"));

var _sync = _interopRequireDefault(require("../errors/sync"));

var _notFound = _interopRequireDefault(require("../errors/notFound"));

var _networkstore = require("./networkstore");

var _cache = require("./cache");

var SYNC_CACHE_TAG = 'kinvey_sync';
var PUSH_IN_PROGRESS = {};

function markPushStart(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = true;
}

function markPushEnd(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = false;
}

function queryToSyncQuery(query, collectionName) {
  if (query && query instanceof _query.default) {
    var newFilter = Object.keys(query.filter).reduce(function (filter, field) {
      return Object.assign({}, filter, (0, _defineProperty2.default)({}, "entity.".concat(field), query.filter[field]));
    }, {});
    var newSort = Object.keys(query.sort).reduce(function (sort, field) {
      return Object.assign({}, sort, (0, _defineProperty2.default)({}, "entity.".concat(field), query.sort[field]));
    }, {});
    var syncQuery = new _query.default({
      filter: newFilter,
      sort: newSort,
      skip: query.skip,
      limit: query.limit
    });

    if (collectionName) {
      syncQuery.equalTo('collection', collectionName);
    }

    return syncQuery;
  }

  return null;
}

var SyncEvent = {
  Create: 'POST',
  Update: 'PUT',
  Delete: 'DELETE'
};
exports.SyncEvent = SyncEvent;

var SyncCache =
/*#__PURE__*/
function (_DataStoreCache) {
  (0, _inherits2.default)(SyncCache, _DataStoreCache);

  function SyncCache(tag) {
    (0, _classCallCheck2.default)(this, SyncCache);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(SyncCache).call(this, SYNC_CACHE_TAG, tag));
  }

  return SyncCache;
}(_cache.DataStoreCache);

var Sync =
/*#__PURE__*/
function () {
  function Sync(collectionName, tag) {
    (0, _classCallCheck2.default)(this, Sync);
    this.collectionName = collectionName;
    this.tag = tag;
  }

  (0, _createClass2.default)(Sync, [{
    key: "isPushInProgress",
    value: function isPushInProgress() {
      return PUSH_IN_PROGRESS[this.collectionName] === true;
    }
  }, {
    key: "find",
    value: function find(query) {
      var syncCache = new SyncCache(this.tag);
      return syncCache.find(query);
    }
  }, {
    key: "findById",
    value: function findById(id) {
      var syncCache = new SyncCache(this.tag);
      return syncCache.findById(id);
    }
  }, {
    key: "count",
    value: function count(query) {
      var syncCache = new SyncCache(this.tag);
      return syncCache.count(query);
    }
  }, {
    key: "addCreateSyncEvent",
    value: function addCreateSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Create, docs);
    }
  }, {
    key: "addUpdateSyncEvent",
    value: function addUpdateSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Update, docs);
    }
  }, {
    key: "addDeleteSyncEvent",
    value: function addDeleteSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Delete, docs);
    }
  }, {
    key: "addSyncEvent",
    value: function () {
      var _addSyncEvent = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(event, docs) {
        var _this = this;

        var syncCache, singular, syncDocs, docsToSync, docWithNoId, query;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                syncCache = new SyncCache(this.tag);
                singular = false;
                syncDocs = [];
                docsToSync = docs;

                if (!Array.isArray(docs)) {
                  singular = true;
                  docsToSync = [docs];
                }

                if (!(docsToSync.length > 0)) {
                  _context.next = 16;
                  break;
                }

                docWithNoId = docsToSync.find(function (doc) {
                  return !doc._id;
                });

                if (!docWithNoId) {
                  _context.next = 9;
                  break;
                }

                throw new _sync.default('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.');

              case 9:
                // Remove existing sync events that match the docs
                query = new _query.default().contains('entityId', docsToSync.map(function (doc) {
                  return doc._id;
                }));
                _context.next = 12;
                return this.remove(query);

              case 12:
                // Don't add delete events for docs that were created offline
                if (event === SyncEvent.Delete) {
                  docsToSync = docsToSync.filter(function (doc) {
                    if (doc._kmd && doc._kmd.local === true) {
                      return false;
                    }

                    return true;
                  });
                } // Add sync events for the docs


                _context.next = 15;
                return syncCache.save(docsToSync.map(function (doc) {
                  return {
                    entityId: doc._id,
                    entity: doc,
                    collection: _this.collectionName,
                    state: {
                      operation: event
                    }
                  };
                }));

              case 15:
                syncDocs = _context.sent;

              case 16:
                return _context.abrupt("return", singular ? syncDocs.shift() : syncDocs);

              case 17:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function addSyncEvent(_x, _x2) {
        return _addSyncEvent.apply(this, arguments);
      }

      return addSyncEvent;
    }()
  }, {
    key: "push",
    value: function () {
      var _push = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(query, options) {
        var _this2 = this;

        var network, cache, syncCache, batchSize, syncDocs, i, batchPush;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                network = new _networkstore.NetworkStore(this.collectionName);
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                syncCache = new SyncCache(this.tag);

                if (!this.isPushInProgress()) {
                  _context4.next = 5;
                  break;
                }

                throw new _sync.default('Data is already being pushed to the backend. Please wait for it to complete before pushing new data to the backend.');

              case 5:
                batchSize = 100;
                _context4.next = 8;
                return syncCache.find(query);

              case 8:
                syncDocs = _context4.sent;

                if (!(syncDocs.length > 0)) {
                  _context4.next = 13;
                  break;
                }

                i = 0;

                batchPush =
                /*#__PURE__*/
                function () {
                  var _ref = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee3() {
                    var pushResults,
                        batch,
                        results,
                        _args3 = arguments;
                    return _regenerator.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            pushResults = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : [];
                            markPushStart(_this2.collectionName);

                            if (!(i >= syncDocs.length)) {
                              _context3.next = 5;
                              break;
                            }

                            markPushEnd(_this2.collectionName);
                            return _context3.abrupt("return", pushResults);

                          case 5:
                            batch = syncDocs.slice(i, i + batchSize);
                            i += batchSize;
                            _context3.next = 9;
                            return Promise.all(batch.map(
                            /*#__PURE__*/
                            function () {
                              var _ref2 = (0, _asyncToGenerator2.default)(
                              /*#__PURE__*/
                              _regenerator.default.mark(function _callee2(syncDoc) {
                                var _id, entityId, _syncDoc$state, state, event, doc, local;

                                return _regenerator.default.wrap(function _callee2$(_context2) {
                                  while (1) {
                                    switch (_context2.prev = _context2.next) {
                                      case 0:
                                        _id = syncDoc._id, entityId = syncDoc.entityId, _syncDoc$state = syncDoc.state, state = _syncDoc$state === void 0 ? {
                                          operation: undefined
                                        } : _syncDoc$state;
                                        event = state.operation;

                                        if (!(event === SyncEvent.Delete)) {
                                          _context2.next = 23;
                                          break;
                                        }

                                        _context2.prev = 3;
                                        _context2.prev = 4;
                                        _context2.next = 7;
                                        return network.removeById(entityId, options);

                                      case 7:
                                        _context2.next = 13;
                                        break;

                                      case 9:
                                        _context2.prev = 9;
                                        _context2.t0 = _context2["catch"](4);

                                        if (_context2.t0 instanceof _notFound.default) {
                                          _context2.next = 13;
                                          break;
                                        }

                                        throw _context2.t0;

                                      case 13:
                                        _context2.next = 15;
                                        return syncCache.removeById(_id);

                                      case 15:
                                        return _context2.abrupt("return", {
                                          _id: entityId,
                                          operation: event
                                        });

                                      case 18:
                                        _context2.prev = 18;
                                        _context2.t1 = _context2["catch"](3);
                                        return _context2.abrupt("return", {
                                          _id: entityId,
                                          operation: event,
                                          error: _context2.t1
                                        });

                                      case 21:
                                        _context2.next = 52;
                                        break;

                                      case 23:
                                        if (!(event === SyncEvent.Create || event === SyncEvent.Update)) {
                                          _context2.next = 52;
                                          break;
                                        }

                                        _context2.next = 26;
                                        return cache.findById(entityId);

                                      case 26:
                                        doc = _context2.sent;
                                        local = false;
                                        _context2.prev = 28;

                                        if (!(event === SyncEvent.Create)) {
                                          _context2.next = 36;
                                          break;
                                        }

                                        if (doc._kmd && doc._kmd.local === true) {
                                          local = true; // tslint:disable-next-line:no-delete

                                          delete doc._id; // tslint:disable-next-line:no-delete

                                          delete doc._kmd.local;
                                        }

                                        _context2.next = 33;
                                        return network.create(doc, options);

                                      case 33:
                                        doc = _context2.sent;
                                        _context2.next = 39;
                                        break;

                                      case 36:
                                        _context2.next = 38;
                                        return network.update(doc, options);

                                      case 38:
                                        doc = _context2.sent;

                                      case 39:
                                        _context2.next = 41;
                                        return syncCache.removeById(_id);

                                      case 41:
                                        _context2.next = 43;
                                        return cache.save(doc);

                                      case 43:
                                        if (!local) {
                                          _context2.next = 46;
                                          break;
                                        }

                                        _context2.next = 46;
                                        return cache.removeById(entityId);

                                      case 46:
                                        return _context2.abrupt("return", {
                                          _id: entityId,
                                          operation: event,
                                          entity: doc
                                        });

                                      case 49:
                                        _context2.prev = 49;
                                        _context2.t2 = _context2["catch"](28);
                                        return _context2.abrupt("return", {
                                          _id: entityId,
                                          operation: event,
                                          entity: doc,
                                          error: _context2.t2
                                        });

                                      case 52:
                                        return _context2.abrupt("return", {
                                          _id: _id,
                                          operation: event,
                                          error: new Error('Unable to push item in sync table because the event was not recognized.')
                                        });

                                      case 53:
                                      case "end":
                                        return _context2.stop();
                                    }
                                  }
                                }, _callee2, this, [[3, 18], [4, 9], [28, 49]]);
                              }));

                              return function (_x5) {
                                return _ref2.apply(this, arguments);
                              };
                            }()));

                          case 9:
                            results = _context3.sent;
                            markPushEnd(_this2.collectionName); // Push remaining docs

                            return _context3.abrupt("return", batchPush(pushResults.concat(results)));

                          case 12:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3, this);
                  }));

                  return function batchPush() {
                    return _ref.apply(this, arguments);
                  };
                }();

                return _context4.abrupt("return", batchPush());

              case 13:
                return _context4.abrupt("return", []);

              case 14:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function push(_x3, _x4) {
        return _push.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: "remove",
    value: function () {
      var _remove = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(query) {
        var syncCache;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                syncCache = new SyncCache(this.tag);
                return _context5.abrupt("return", syncCache.remove(query));

              case 2:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function remove(_x6) {
        return _remove.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: "removeById",
    value: function () {
      var _removeById = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(id) {
        var syncCache;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                syncCache = new SyncCache(this.tag);
                return _context6.abrupt("return", syncCache.removeById(id));

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function removeById(_x7) {
        return _removeById.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: "clear",
    value: function () {
      var _clear = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7() {
        var syncCache;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                syncCache = new SyncCache(this.tag);
                return _context7.abrupt("return", syncCache.remove());

              case 2:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function clear() {
        return _clear.apply(this, arguments);
      }

      return clear;
    }()
  }]);
  return Sync;
}();

exports.Sync = Sync;
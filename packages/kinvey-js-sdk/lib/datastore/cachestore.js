'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _cache = require('../cache');

var _cache2 = _interopRequireDefault(_cache);

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _kmd = require('../kmd');

var _kmd2 = _interopRequireDefault(_kmd);

var _http = require('../http');

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SYNC_CACHE_TAG = 'kinvey-sync';
var QUERY_CACHE_TAG = 'kinvey-query';
var PAGE_LIMIT = 10000;

var SyncEvent = {
  Create: 'Create',
  Update: 'Update',
  Delete: 'Delete'
};

var DataStoreCache = function (_Cache) {
  _inherits(DataStoreCache, _Cache);

  function DataStoreCache(appKey, name, tag) {
    _classCallCheck(this, DataStoreCache);

    var collectionName = name;

    if (tag) {
      if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
        throw new Error('A tag can only contain letters, numbers, and "-".');
      }
      collectionName = collectionName + '.' + tag;
    }

    return _possibleConstructorReturn(this, (DataStoreCache.__proto__ || Object.getPrototypeOf(DataStoreCache)).call(this, appKey, collectionName));
  }

  return DataStoreCache;
}(_cache2.default);

var SyncCache = function (_DataStoreCache) {
  _inherits(SyncCache, _DataStoreCache);

  function SyncCache(appKey, collectionName) {
    _classCallCheck(this, SyncCache);

    return _possibleConstructorReturn(this, (SyncCache.__proto__ || Object.getPrototypeOf(SyncCache)).call(this, appKey, collectionName, SYNC_CACHE_TAG));
  }

  return SyncCache;
}(DataStoreCache);

var QueryCache = function (_DataStoreCache2) {
  _inherits(QueryCache, _DataStoreCache2);

  function QueryCache(appKey, collectionName) {
    _classCallCheck(this, QueryCache);

    return _possibleConstructorReturn(this, (QueryCache.__proto__ || Object.getPrototypeOf(QueryCache)).call(this, appKey, collectionName, QUERY_CACHE_TAG));
  }

  _createClass(QueryCache, [{
    key: 'updateWithResponse',
    value: function updateWithResponse(doc, response) {
      var updatedDoc = doc;
      var headers = new _http.KinveyHeaders(response.headers);
      updatedDoc.lastRequest = headers.requestStart;
      return this.save(updatedDoc);
    }
  }]);

  return QueryCache;
}(DataStoreCache);

var CacheStore = function (_NetworkStore) {
  _inherits(CacheStore, _NetworkStore);

  function CacheStore(appKey, collectionName, tag) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { useDeltaSet: false, useAutoPagination: false, autoSync: false };

    _classCallCheck(this, CacheStore);

    var _this4 = _possibleConstructorReturn(this, (CacheStore.__proto__ || Object.getPrototypeOf(CacheStore)).call(this, appKey, collectionName));

    _this4.cache = new DataStoreCache(appKey, collectionName, tag);
    _this4.syncCache = new SyncCache(appKey, collectionName);
    _this4.queryCache = new QueryCache(appKey, collectionName);
    _this4.useDeltaSet = options.useDeltaSet === true;
    _this4.useAutoPagination = options.useAutoPagination === true;
    _this4.autoSync = options.autoSync === true;
    return _this4;
  }

  _createClass(CacheStore, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(query) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { autoSync: false, cacheCallback: function cacheCallback() {} };
        var cacheCallback, cachedDocs;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                cacheCallback = options.cacheCallback;

                if (!(0, _isFunction2.default)(cacheCallback)) {
                  _context.next = 6;
                  break;
                }

                _context.next = 4;
                return this.cache.find(query);

              case 4:
                cachedDocs = _context.sent;

                cacheCallback(cachedDocs);

              case 6:
                _context.next = 8;
                return this.pull(query, options);

              case 8:
                return _context.abrupt('return', this.cache.find(query));

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x3) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(query) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { autoSync: false, cacheCallback: function cacheCallback() {} };
        var cacheCallback, cacheCount;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                cacheCallback = options.cacheCallback;

                if (!(0, _isFunction2.default)(cacheCallback)) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 4;
                return this.cache.count(query);

              case 4:
                cacheCount = _context2.sent;

                cacheCallback(cacheCount);

              case 6:
                _context2.next = 8;
                return this.pull(query, options);

              case 8:
                return _context2.abrupt('return', this.cache.count(query));

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function count(_x5) {
        return _ref2.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'findById',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { cacheCallback: function cacheCallback() {} };
        var cacheCallback, cacheDoc, query;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                cacheCallback = options.cacheCallback;

                if (!(0, _isFunction2.default)(cacheCallback)) {
                  _context3.next = 6;
                  break;
                }

                _context3.next = 4;
                return this.cache.findById(id);

              case 4:
                cacheDoc = _context3.sent;

                cacheCallback(cacheDoc);

              case 6:
                query = new _query2.default().equalTo('_id', id);
                _context3.next = 9;
                return this.pull(query, options);

              case 9:
                return _context3.abrupt('return', this.cache.findById(id));

              case 10:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function findById(_x7) {
        return _ref3.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'create',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(doc) {
        var cachedDoc, query;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.cache.save(doc);

              case 2:
                cachedDoc = _context4.sent;
                _context4.next = 5;
                return this.addCreateSyncEvent(cachedDoc);

              case 5:
                if (!this.autoSync) {
                  _context4.next = 9;
                  break;
                }

                query = new _query2.default().equalTo('_id', cachedDoc._id);
                _context4.next = 9;
                return this.push(query);

              case 9:
                return _context4.abrupt('return', cachedDoc);

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function create(_x8) {
        return _ref4.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(doc) {
        var cachedDoc, query;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.cache.save(doc);

              case 2:
                cachedDoc = _context5.sent;
                _context5.next = 5;
                return this.addUpdateSyncEvent(cachedDoc);

              case 5:
                if (!this.autoSync) {
                  _context5.next = 9;
                  break;
                }

                query = new _query2.default().equalTo('_id', cachedDoc._id);
                _context5.next = 9;
                return this.push(query);

              case 9:
                return _context5.abrupt('return', cachedDoc);

              case 10:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function update(_x9) {
        return _ref5.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(query) {
        var docs, count, syncDocs, pushQuery, pushResults;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.cache.find(query);

              case 2:
                docs = _context6.sent;

                if (!(docs.length > 0)) {
                  _context6.next = 19;
                  break;
                }

                _context6.next = 6;
                return this.syncCache.remove(query);

              case 6:
                _context6.next = 8;
                return this.cache.remove(query);

              case 8:
                count = _context6.sent;
                _context6.next = 11;
                return this.addDeleteSyncEvent(docs);

              case 11:
                syncDocs = _context6.sent;

                if (!(syncDocs.length > 0 && this.autoSync)) {
                  _context6.next = 18;
                  break;
                }

                // Push the sync events
                pushQuery = new _query2.default().contains('_id', syncDocs.map(function (doc) {
                  return doc._id;
                }));
                _context6.next = 16;
                return this.push(pushQuery);

              case 16:
                pushResults = _context6.sent;
                return _context6.abrupt('return', pushResults.reduce(function (count, pushResult) {
                  if (pushResult.error) {
                    return count - 1;
                  }

                  return count;
                }, count));

              case 18:
                return _context6.abrupt('return', count);

              case 19:
                return _context6.abrupt('return', 0);

              case 20:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function remove(_x10) {
        return _ref6.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(id) {
        var doc, count, query, pushResults, pushResult;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.cache.findById(id);

              case 2:
                doc = _context7.sent;

                if (!doc) {
                  _context7.next = 18;
                  break;
                }

                _context7.next = 6;
                return this.syncCache.removeById(id);

              case 6:
                _context7.next = 8;
                return this.cache.removeById(id);

              case 8:
                count = _context7.sent;
                _context7.next = 11;
                return this.addDeleteSyncEvent(doc);

              case 11:
                if (!this.autoSync) {
                  _context7.next = 17;
                  break;
                }

                // Push the sync event
                query = new _query2.default().equalTo('_id', doc._id);
                _context7.next = 15;
                return this.push(query);

              case 15:
                pushResults = _context7.sent;


                // Process push result
                if (pushResults.length > 0) {
                  pushResult = pushResults.shift();


                  if (pushResult.error) {
                    count -= 1;
                  }
                }

              case 17:
                return _context7.abrupt('return', count);

              case 18:
                return _context7.abrupt('return', 0);

              case 19:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function removeById(_x11) {
        return _ref7.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.syncCache.clear();

              case 2:
                _context8.next = 4;
                return this.queryCache.clear();

              case 4:
                return _context8.abrupt('return', this.cache.clear());

              case 5:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function clear() {
        return _ref8.apply(this, arguments);
      }

      return clear;
    }()
  }, {
    key: 'push',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
        var _this5 = this;

        var batchSize, syncDocs, i, batchPush;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                batchSize = 100;
                _context11.next = 3;
                return this.syncCache.find();

              case 3:
                syncDocs = _context11.sent;

                if (!(syncDocs.length > 0)) {
                  _context11.next = 8;
                  break;
                }

                i = 0;

                batchPush = function () {
                  var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(pushResults) {
                    var batch, results;
                    return regeneratorRuntime.wrap(function _callee10$(_context10) {
                      while (1) {
                        switch (_context10.prev = _context10.next) {
                          case 0:
                            if (!(i >= syncDocs.length)) {
                              _context10.next = 2;
                              break;
                            }

                            return _context10.abrupt('return', pushResults);

                          case 2:
                            batch = syncDocs.slice(i, i + batchSize);

                            i += batchSize;

                            _context10.next = 6;
                            return Promise.all(batch.map(function () {
                              var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(syncDoc) {
                                var _id, _syncDoc$state, state, event, local, doc, kmd, response, _response;

                                return regeneratorRuntime.wrap(function _callee9$(_context9) {
                                  while (1) {
                                    switch (_context9.prev = _context9.next) {
                                      case 0:
                                        _id = syncDoc._id, _syncDoc$state = syncDoc.state, state = _syncDoc$state === undefined ? { event: undefined } : _syncDoc$state;
                                        event = state.event;

                                        if (!(event === SyncEvent.Delete)) {
                                          _context9.next = 16;
                                          break;
                                        }

                                        _context9.prev = 3;
                                        _context9.next = 6;
                                        return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'removeById', _this5).call(_this5, _id);

                                      case 6:
                                        _context9.next = 8;
                                        return _this5.syncCache.removeById(_id);

                                      case 8:
                                        return _context9.abrupt('return', {
                                          _id: _id,
                                          event: event
                                        });

                                      case 11:
                                        _context9.prev = 11;
                                        _context9.t0 = _context9['catch'](3);
                                        return _context9.abrupt('return', {
                                          _id: _id,
                                          event: event,
                                          error: _context9.t0
                                        });

                                      case 14:
                                        _context9.next = 48;
                                        break;

                                      case 16:
                                        if (!(event === SyncEvent.Create || event === SyncEvent.Update)) {
                                          _context9.next = 48;
                                          break;
                                        }

                                        _context9.prev = 17;
                                        local = false;

                                        // Get the doc from the cache

                                        _context9.next = 21;
                                        return _this5.cache.findById(_id);

                                      case 21:
                                        doc = _context9.sent;

                                        if (!(event === SyncEvent.Create)) {
                                          _context9.next = 31;
                                          break;
                                        }

                                        kmd = new _kmd2.default(doc._kmd);


                                        if (kmd.isLocal()) {
                                          local = true;
                                          // tslint:disable-next-line:no-delete
                                          delete doc._id;
                                          // tslint:disable-next-line:no-delete
                                          delete doc._kmd.local;
                                        }

                                        _context9.next = 27;
                                        return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'create', _this5).call(_this5, doc);

                                      case 27:
                                        response = _context9.sent;

                                        doc = response.data;
                                        _context9.next = 35;
                                        break;

                                      case 31:
                                        _context9.next = 33;
                                        return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'update', _this5).call(_this5, doc);

                                      case 33:
                                        _response = _context9.sent;

                                        doc = _response.data;

                                      case 35:
                                        _context9.next = 37;
                                        return _this5.syncCache.removeById(_id);

                                      case 37:
                                        _context9.next = 39;
                                        return _this5.cache.save(doc);

                                      case 39:
                                        if (!local) {
                                          _context9.next = 42;
                                          break;
                                        }

                                        _context9.next = 42;
                                        return _this5.cache.removeById(_id);

                                      case 42:
                                        return _context9.abrupt('return', {
                                          _id: _id,
                                          event: event,
                                          doc: doc
                                        });

                                      case 45:
                                        _context9.prev = 45;
                                        _context9.t1 = _context9['catch'](17);
                                        return _context9.abrupt('return', {
                                          _id: _id,
                                          event: event,
                                          error: _context9.t1
                                        });

                                      case 48:
                                        return _context9.abrupt('return', {
                                          _id: _id,
                                          event: event,
                                          error: new Error('Unable to push item in sync table because the event was not recognized.')
                                        });

                                      case 49:
                                      case 'end':
                                        return _context9.stop();
                                    }
                                  }
                                }, _callee9, _this5, [[3, 11], [17, 45]]);
                              }));

                              return function (_x13) {
                                return _ref11.apply(this, arguments);
                              };
                            }()));

                          case 6:
                            results = _context10.sent;
                            return _context10.abrupt('return', batchPush(pushResults.concat(results)));

                          case 8:
                          case 'end':
                            return _context10.stop();
                        }
                      }
                    }, _callee10, _this5);
                  }));

                  return function batchPush(_x12) {
                    return _ref10.apply(this, arguments);
                  };
                }();

                return _context11.abrupt('return', batchPush([]));

              case 8:
                return _context11.abrupt('return', []);

              case 9:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function push() {
        return _ref9.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'pull',
    value: function () {
      var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(query) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { useDeltaSet: false, useAutoPagination: false, autoSync: false };

        var _options$useDeltaSet, useDeltaSet, _options$useAutoPagin, useAutoPagination, _options$autoSync, autoSync, count, queryKey, deltaSetQuery, _ref13, _ref14, cachedQuery, since, queryObject, url, request, _response2, _response2$data, changed, deleted, removeQuery, skip, limit, _docs, _response3, _count, page, response, docs;

        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _options$useDeltaSet = options.useDeltaSet, useDeltaSet = _options$useDeltaSet === undefined ? this.useDeltaSet : _options$useDeltaSet, _options$useAutoPagin = options.useAutoPagination, useAutoPagination = _options$useAutoPagin === undefined ? this.useAutoPagination : _options$useAutoPagin, _options$autoSync = options.autoSync, autoSync = _options$autoSync === undefined ? this.autoSync : _options$autoSync;
                _context12.next = 3;
                return this.syncCache.count(query);

              case 3:
                count = _context12.sent;

                if (!(count > 0)) {
                  _context12.next = 12;
                  break;
                }

                if (!autoSync) {
                  _context12.next = 9;
                  break;
                }

                _context12.next = 8;
                return this.push();

              case 8:
                return _context12.abrupt('return', this.pull(query, { useDeltaSet: useDeltaSet, useAutoPagination: useAutoPagination, autoSync: autoSync }));

              case 9:
                if (!(count === 1)) {
                  _context12.next = 11;
                  break;
                }

                throw new Error('Unable to pull docs from the backend. There is ' + count + ' doc' + ' that needs to be pushed to the backend.');

              case 11:
                throw new Error('Unable to pull docs from the backend. There are ' + count + ' docs' + ' that need to be pushed to the backend.');

              case 12:
                queryKey = query ? JSON.stringify(query.toQueryObject()) : '';
                deltaSetQuery = new _query2.default().equalTo('query', queryKey);
                _context12.next = 16;
                return this.queryCache.find(deltaSetQuery);

              case 16:
                _ref13 = _context12.sent;
                _ref14 = _slicedToArray(_ref13, 1);
                cachedQuery = _ref14[0];
                since = cachedQuery ? cachedQuery.lastRequest : undefined;


                if (!cachedQuery) {
                  cachedQuery = { collectionName: this.collectionName, query: queryKey };
                }

                if (!(useDeltaSet && since)) {
                  _context12.next = 42;
                  break;
                }

                queryObject = { since: since };

                // TODO: handle ParameterValueOutOfRangeError

                // Find with delta set

                if (query) {
                  queryObject = Object.assign({}, query.toQueryObject(), queryObject);
                }

                url = (0, _http.formatKinveyBaasUrl)(this.pathname + '/_deltaset', queryObject);
                request = (0, _networkstore.createRequest)(_http.RequestMethod.GET, url);
                _context12.next = 28;
                return (0, _http.execute)(request);

              case 28:
                _response2 = _context12.sent;
                _response2$data = _response2.data, changed = _response2$data.changed, deleted = _response2$data.deleted;

                // Update the query cache

                _context12.next = 32;
                return this.queryCache.updateWithResponse(cachedQuery, _response2);

              case 32:
                if (!(Array.isArray(deleted) && deleted.length > 0)) {
                  _context12.next = 36;
                  break;
                }

                removeQuery = new _query2.default().contains('_id', deleted.map(function (doc) {
                  return doc._id;
                }));
                _context12.next = 36;
                return this.cache.remove(removeQuery);

              case 36:
                if (!(Array.isArray(changed) && changed.length > 0)) {
                  _context12.next = 39;
                  break;
                }

                _context12.next = 39;
                return this.cache.save(changed);

              case 39:
                return _context12.abrupt('return', changed.length);

              case 42:
                if (!useAutoPagination) {
                  _context12.next = 62;
                  break;
                }

                skip = 0;
                limit = PAGE_LIMIT;
                _docs = [];

                // Get the total count of docs

                _context12.next = 48;
                return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'count', this).call(this, query);

              case 48:
                _response3 = _context12.sent;
                _count = 'count' in _response3.data ? _response3.data.count : Infinity;

                // Update the query cache

                _context12.next = 52;
                return this.queryCache.updateWithResponse(cachedQuery, _response3);

              case 52:
                if (!(skip + limit < _count)) {
                  _context12.next = 59;
                  break;
                }

                _context12.next = 55;
                return this.findPage(query, skip, limit);

              case 55:
                page = _context12.sent;

                _docs = _docs.concat(page);
                _context12.next = 52;
                break;

              case 59:
                _context12.next = 61;
                return this.cache.save(_docs);

              case 61:
                return _context12.abrupt('return', _docs.length);

              case 62:
                _context12.next = 64;
                return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'find', this).call(this, query);

              case 64:
                response = _context12.sent;
                docs = response.data;

                // Update the query cache

                _context12.next = 68;
                return this.queryCache.updateWithResponse(cachedQuery, response);

              case 68:
                _context12.next = 70;
                return this.cache.save(docs);

              case 70:
                return _context12.abrupt('return', docs.length);

              case 71:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function pull(_x15) {
        return _ref12.apply(this, arguments);
      }

      return pull;
    }()
  }, {
    key: 'sync',
    value: function () {
      var _ref15 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(query) {
        var push, pull;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return this.push();

              case 2:
                push = _context13.sent;
                _context13.next = 5;
                return this.pull(query);

              case 5:
                pull = _context13.sent;
                return _context13.abrupt('return', { push: push, pull: pull });

              case 7:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function sync(_x16) {
        return _ref15.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: 'addCreateSyncEvent',
    value: function addCreateSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Create, docs);
    }
  }, {
    key: 'addUpdateSyncEvent',
    value: function addUpdateSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Update, docs);
    }
  }, {
    key: 'addDeleteSyncEvent',
    value: function addDeleteSyncEvent(docs) {
      return this.addSyncEvent(SyncEvent.Delete, docs);
    }
  }, {
    key: 'addSyncEvent',
    value: function () {
      var _ref16 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(event, docs) {
        var singular, syncDocs, docWithNoId, query;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                singular = false;
                syncDocs = [];


                if (!Array.isArray(docs)) {
                  singular = true;
                  docs = [docs];
                }

                if (!(docs.length > 0)) {
                  _context14.next = 14;
                  break;
                }

                docWithNoId = docs.find(function (doc) {
                  return !doc._id;
                });

                if (!docWithNoId) {
                  _context14.next = 7;
                  break;
                }

                return _context14.abrupt('return', Promise.reject(new Error('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.')));

              case 7:

                if (event === SyncEvent.Delete) {
                  docs = docs.filter(function (doc) {
                    if (doc._kmd) {
                      return doc._kmd.local === false;
                    }

                    return true;
                  });
                }

                query = new _query2.default().contains('_id', docs.map(function (doc) {
                  return doc._id;
                }));
                _context14.next = 11;
                return this.remove(query);

              case 11:
                _context14.next = 13;
                return this.syncCache.save(docs.map(function (doc) {
                  return {
                    _id: doc._id,
                    state: {
                      event: event
                    }
                  };
                }));

              case 13:
                syncDocs = _context14.sent;

              case 14:
                return _context14.abrupt('return', singular ? syncDocs[0] : syncDocs);

              case 15:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function addSyncEvent(_x17, _x18) {
        return _ref16.apply(this, arguments);
      }

      return addSyncEvent;
    }()
  }]);

  return CacheStore;
}(_networkstore2.default);

exports.default = CacheStore;
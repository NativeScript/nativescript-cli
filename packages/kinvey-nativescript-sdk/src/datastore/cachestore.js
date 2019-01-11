"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheStore = exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _times = _interopRequireDefault(require("lodash/times"));

var _observable = _interopRequireDefault(require("../observable"));

var _query = _interopRequireDefault(require("../query"));

var _config = require("../kinvey/config");

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _missingConfiguration = _interopRequireDefault(require("../errors/missingConfiguration"));

var _parameterValueOutOfRange = _interopRequireDefault(require("../errors/parameterValueOutOfRange"));

var _notFound = _interopRequireDefault(require("../errors/notFound"));

var _base = _interopRequireDefault(require("../errors/base"));

var _cache = require("./cache");

var _sync2 = require("./sync");

var _networkstore = require("./networkstore");

var NAMESPACE = 'appdata';
var PAGE_LIMIT = 10000;

var InvalidDeltaSetQueryError =
/*#__PURE__*/
function (_BaseError) {
  (0, _inherits2.default)(InvalidDeltaSetQueryError, _BaseError);

  function InvalidDeltaSetQueryError() {
    var _getPrototypeOf2;

    var _this;

    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Invalid delta set query.';
    (0, _classCallCheck2.default)(this, InvalidDeltaSetQueryError);

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    // Pass remaining arguments (including vendor specific ones) to parent constructor
    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(InvalidDeltaSetQueryError)).call.apply(_getPrototypeOf2, [this, message].concat(args))); // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (Error.captureStackTrace) {
      Error.captureStackTrace((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), InvalidDeltaSetQueryError);
    } // Custom debugging information


    _this.name = 'InvalidDeltaSetQueryError';
    return _this;
  }

  return InvalidDeltaSetQueryError;
}(_base.default);

exports.default = InvalidDeltaSetQueryError;

var CacheStore =
/*#__PURE__*/
function () {
  function CacheStore(collectionName) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      tag: undefined,
      useDeltaSet: false,
      useAutoPagination: false,
      autoSync: true
    };
    (0, _classCallCheck2.default)(this, CacheStore);
    this.collectionName = collectionName;
    this.tag = options.tag;
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination;
    this.autoSync = options.autoSync === true;
  }

  (0, _createClass2.default)(CacheStore, [{
    key: "find",
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var autoSync = options.autoSync === true || this.autoSync;
      var cache = new _cache.DataStoreCache(this.collectionName, this.tag);

      var stream = _observable.default.create(
      /*#__PURE__*/
      function () {
        var _ref = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(observer) {
          var cachedDocs, docs;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  _context.next = 3;
                  return cache.find(query);

                case 3:
                  cachedDocs = _context.sent;
                  observer.next(cachedDocs);

                  if (!autoSync) {
                    _context.next = 12;
                    break;
                  }

                  _context.next = 8;
                  return _this2.pull(query, options);

                case 8:
                  _context.next = 10;
                  return cache.find(query);

                case 10:
                  docs = _context.sent;
                  observer.next(docs);

                case 12:
                  observer.complete();
                  _context.next = 18;
                  break;

                case 15:
                  _context.prev = 15;
                  _context.t0 = _context["catch"](0);
                  observer.error(_context.t0);

                case 18:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[0, 15]]);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "count",
    value: function count(query) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var autoSync = options.autoSync === true || this.autoSync;
      var cache = new _cache.DataStoreCache(this.collectionName, this.tag);

      var stream = _observable.default.create(
      /*#__PURE__*/
      function () {
        var _ref2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(observer) {
          var cacheCount, network, count;
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;
                  _context2.next = 3;
                  return cache.count(query);

                case 3:
                  cacheCount = _context2.sent;
                  observer.next(cacheCount);

                  if (!autoSync) {
                    _context2.next = 11;
                    break;
                  }

                  network = new _networkstore.NetworkStore(_this3.collectionName);
                  _context2.next = 9;
                  return network.count(query, options).toPromise();

                case 9:
                  count = _context2.sent;
                  observer.next(count);

                case 11:
                  observer.complete();
                  _context2.next = 17;
                  break;

                case 14:
                  _context2.prev = 14;
                  _context2.t0 = _context2["catch"](0);
                  observer.error(_context2.t0);

                case 17:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[0, 14]]);
        }));

        return function (_x2) {
          return _ref2.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "group",
    value: function group(aggregation) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var autoSync = options.autoSync === true || this.autoSync;
      var cache = new _cache.DataStoreCache(this.collectionName, this.tag);

      var stream = _observable.default.create(
      /*#__PURE__*/
      function () {
        var _ref3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee3(observer) {
          var cacheResult, network, networkResult;
          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;
                  _context3.next = 3;
                  return cache.group(aggregation);

                case 3:
                  cacheResult = _context3.sent;
                  observer.next(cacheResult);

                  if (!autoSync) {
                    _context3.next = 11;
                    break;
                  }

                  network = new _networkstore.NetworkStore(_this4.collectionName);
                  _context3.next = 9;
                  return network.group(aggregation, options).toPromise();

                case 9:
                  networkResult = _context3.sent;
                  observer.next(networkResult);

                case 11:
                  observer.complete();
                  _context3.next = 17;
                  break;

                case 14:
                  _context3.prev = 14;
                  _context3.t0 = _context3["catch"](0);
                  observer.error(_context3.t0);

                case 17:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this, [[0, 14]]);
        }));

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "findById",
    value: function findById(id) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _observable.default.create(
      /*#__PURE__*/
      function () {
        var _ref4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee4(observer) {
          var autoSync, cache, cachedDoc, doc;
          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (id) {
                    _context4.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context4.next = 22;
                  break;

                case 5:
                  autoSync = options.autoSync === true || _this5.autoSync;
                  cache = new _cache.DataStoreCache(_this5.collectionName, _this5.tag);
                  _context4.next = 9;
                  return cache.findById(id);

                case 9:
                  cachedDoc = _context4.sent;

                  if (cachedDoc) {
                    _context4.next = 16;
                    break;
                  }

                  if (autoSync) {
                    _context4.next = 13;
                    break;
                  }

                  throw new _notFound.default();

                case 13:
                  observer.next(undefined);
                  _context4.next = 17;
                  break;

                case 16:
                  observer.next(cachedDoc);

                case 17:
                  if (!autoSync) {
                    _context4.next = 22;
                    break;
                  }

                  _context4.next = 20;
                  return _this5.pullById(id, options);

                case 20:
                  doc = _context4.sent;
                  observer.next(doc);

                case 22:
                  observer.complete();
                  _context4.next = 28;
                  break;

                case 25:
                  _context4.prev = 25;
                  _context4.t0 = _context4["catch"](0);
                  observer.error(_context4.t0);

                case 28:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this, [[0, 25]]);
        }));

        return function (_x4) {
          return _ref4.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "create",
    value: function () {
      var _create = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(doc) {
        var options,
            autoSync,
            cache,
            sync,
            cachedDoc,
            syncDoc,
            query,
            pushResults,
            pushResult,
            _args5 = arguments;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                options = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : {};

                if (!(0, _isArray.default)(doc)) {
                  _context5.next = 3;
                  break;
                }

                throw new _kinvey.default('Unable to create an array of entities.', 'Please create entities one by one.');

              case 3:
                autoSync = options.autoSync === true || this.autoSync;
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                sync = new _sync2.Sync(this.collectionName, this.tag);
                _context5.next = 8;
                return cache.save(doc);

              case 8:
                cachedDoc = _context5.sent;
                _context5.next = 11;
                return sync.addCreateSyncEvent(cachedDoc);

              case 11:
                syncDoc = _context5.sent;

                if (!autoSync) {
                  _context5.next = 21;
                  break;
                }

                query = new _query.default().equalTo('_id', syncDoc._id);
                _context5.next = 16;
                return sync.push(query, options);

              case 16:
                pushResults = _context5.sent;
                pushResult = pushResults.shift();

                if (!pushResult.error) {
                  _context5.next = 20;
                  break;
                }

                throw pushResult.error;

              case 20:
                return _context5.abrupt("return", pushResult.entity);

              case 21:
                return _context5.abrupt("return", cachedDoc);

              case 22:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function create(_x5) {
        return _create.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: "update",
    value: function () {
      var _update = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(doc) {
        var options,
            autoSync,
            cache,
            sync,
            cachedDoc,
            syncDoc,
            query,
            pushResults,
            pushResult,
            _args6 = arguments;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = _args6.length > 1 && _args6[1] !== undefined ? _args6[1] : {};

                if (!(0, _isArray.default)(doc)) {
                  _context6.next = 3;
                  break;
                }

                throw new _kinvey.default('Unable to update an array of entities.', 'Please update entities one by one.');

              case 3:
                if (doc._id) {
                  _context6.next = 5;
                  break;
                }

                throw new _kinvey.default('The entity provided does not contain an _id. An _id is required to update the entity.', doc);

              case 5:
                autoSync = options.autoSync === true || this.autoSync;
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                sync = new _sync2.Sync(this.collectionName, this.tag);
                _context6.next = 10;
                return cache.save(doc);

              case 10:
                cachedDoc = _context6.sent;
                _context6.next = 13;
                return sync.addUpdateSyncEvent(cachedDoc);

              case 13:
                syncDoc = _context6.sent;

                if (!autoSync) {
                  _context6.next = 23;
                  break;
                }

                query = new _query.default().equalTo('_id', syncDoc._id);
                _context6.next = 18;
                return sync.push(query, options);

              case 18:
                pushResults = _context6.sent;
                pushResult = pushResults.shift();

                if (!pushResult.error) {
                  _context6.next = 22;
                  break;
                }

                throw pushResult.error;

              case 22:
                return _context6.abrupt("return", pushResult.entity);

              case 23:
                return _context6.abrupt("return", cachedDoc);

              case 24:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function update(_x6) {
        return _update.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: "save",
    value: function save(doc, options) {
      if (doc._id) {
        return this.update(doc, options);
      }

      return this.create(doc, options);
    }
  }, {
    key: "remove",
    value: function () {
      var _remove = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7(query) {
        var options,
            autoSync,
            cache,
            sync,
            count,
            docs,
            findQuery,
            syncDocs,
            pushQuery,
            pushResults,
            _args7 = arguments;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                options = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : {};
                autoSync = options.autoSync === true || this.autoSync;
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                sync = new _sync2.Sync(this.collectionName, this.tag);
                count = 0; // Find the docs that will be removed from the cache that match the query

                _context7.next = 7;
                return cache.find(query);

              case 7:
                docs = _context7.sent;

                if (!(docs.length > 0)) {
                  _context7.next = 14;
                  break;
                }

                _context7.next = 11;
                return cache.remove(query);

              case 11:
                count = _context7.sent;
                _context7.next = 14;
                return sync.addDeleteSyncEvent(docs);

              case 14:
                if (!autoSync) {
                  _context7.next = 25;
                  break;
                }

                findQuery = (0, _sync2.queryToSyncQuery)(query, this.collectionName);
                _context7.next = 18;
                return sync.find(findQuery);

              case 18:
                syncDocs = _context7.sent;

                if (!(syncDocs.length > 0)) {
                  _context7.next = 25;
                  break;
                }

                pushQuery = new _query.default().contains('_id', syncDocs.map(function (doc) {
                  return doc._id;
                }));
                _context7.next = 23;
                return sync.push(pushQuery);

              case 23:
                pushResults = _context7.sent;
                count = pushResults.reduce(function (count, pushResult) {
                  if (pushResult.error) {
                    return count - 1;
                  }

                  return count;
                }, count || syncDocs.length);

              case 25:
                return _context7.abrupt("return", {
                  count: count
                });

              case 26:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function remove(_x7) {
        return _remove.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: "removeById",
    value: function () {
      var _removeById = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee8(id) {
        var options,
            autoSync,
            cache,
            sync,
            count,
            doc,
            syncDoc,
            query,
            pushResults,
            pushResult,
            _args8 = arguments;
        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : {};
                autoSync = options.autoSync === true || this.autoSync;
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                sync = new _sync2.Sync(this.collectionName, this.tag);
                count = 0;

                if (!id) {
                  _context8.next = 28;
                  break;
                }

                _context8.next = 8;
                return cache.findById(id);

              case 8:
                doc = _context8.sent;

                if (!doc) {
                  _context8.next = 27;
                  break;
                }

                _context8.next = 12;
                return cache.removeById(id);

              case 12:
                count = _context8.sent;
                _context8.next = 15;
                return sync.addDeleteSyncEvent(doc);

              case 15:
                syncDoc = _context8.sent;

                if (!(autoSync && syncDoc)) {
                  _context8.next = 24;
                  break;
                }

                query = new _query.default().equalTo('_id', syncDoc._id);
                _context8.next = 20;
                return sync.push(query);

              case 20:
                pushResults = _context8.sent;

                if (pushResults.length > 0) {
                  pushResult = pushResults.shift();

                  if (pushResult.error) {
                    count -= 1;
                  }
                }

                _context8.next = 25;
                break;

              case 24:
                count = 1;

              case 25:
                _context8.next = 28;
                break;

              case 27:
                throw new _notFound.default();

              case 28:
                return _context8.abrupt("return", {
                  count: count
                });

              case 29:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function removeById(_x8) {
        return _removeById.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: "clear",
    value: function () {
      var _clear = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee9(query) {
        var cache, count, queryCache;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                // Remove the docs from the cache
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                _context9.next = 3;
                return cache.remove(query);

              case 3:
                count = _context9.sent;
                _context9.next = 6;
                return this.clearSync(query);

              case 6:
                // Clear the query cache
                if (!query) {
                  queryCache = new _cache.QueryCache(this.tag);
                  queryCache.remove();
                } // Return the cound


                return _context9.abrupt("return", {
                  count: count
                });

              case 8:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function clear(_x9) {
        return _clear.apply(this, arguments);
      }

      return clear;
    }()
  }, {
    key: "push",
    value: function push(query, options) {
      var sync = new _sync2.Sync(this.collectionName, this.tag);
      return sync.push(null, options);
    }
  }, {
    key: "pull",
    value: function () {
      var _pull = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee10(query) {
        var options,
            network,
            cache,
            queryCache,
            useDeltaSet,
            useAutoPagination,
            count,
            key,
            queryCacheDoc,
            queryObject,
            _getConfig,
            apiProtocol,
            apiHost,
            appKey,
            url,
            request,
            _response,
            _response$data,
            changed,
            deleted,
            removeQuery,
            _response2,
            _count,
            pageSize,
            pageCount,
            pageQueries,
            pagePromises,
            pageCounts,
            totalPageCount,
            response,
            docs,
            _args10 = arguments;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                options = _args10.length > 1 && _args10[1] !== undefined ? _args10[1] : {};
                network = new _networkstore.NetworkStore(this.collectionName);
                cache = new _cache.DataStoreCache(this.collectionName, this.tag);
                queryCache = new _cache.QueryCache(this.tag);
                useDeltaSet = options.useDeltaSet === true || this.useDeltaSet;
                useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination; // Push sync queue

                _context10.next = 8;
                return this.pendingSyncCount();

              case 8:
                count = _context10.sent;

                if (!(count > 0)) {
                  _context10.next = 13;
                  break;
                }

                if (!(count === 1)) {
                  _context10.next = 12;
                  break;
                }

                throw new _kinvey.default("Unable to pull entities from the backend. There is ".concat(count, " entity") + ' that needs to be pushed to the backend.');

              case 12:
                throw new _kinvey.default("Unable to pull entities from the backend. There are ".concat(count, " entities") + ' that need to be pushed to the backend.');

              case 13:
                if (!(useDeltaSet && (!query || query.skip === 0 && query.limit === Infinity))) {
                  _context10.next = 45;
                  break;
                }

                _context10.prev = 14;
                key = queryCache.serializeQuery(query);
                _context10.next = 18;
                return queryCache.findByKey(key);

              case 18:
                queryCacheDoc = _context10.sent;

                if (!(queryCacheDoc && queryCacheDoc.lastRequest)) {
                  _context10.next = 39;
                  break;
                }

                queryObject = {
                  since: queryCacheDoc.lastRequest
                };

                if (query) {
                  queryObject = Object.assign({}, query.toQueryObject(), queryObject);
                } // Delta Set request


                _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/appdata/".concat(appKey, "/").concat(this.collectionName, "/_deltaset"), queryObject);
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.GET,
                  auth: _auth.Auth.Session,
                  url: url
                });
                _context10.next = 27;
                return request.execute();

              case 27:
                _response = _context10.sent;
                _response$data = _response.data, changed = _response$data.changed, deleted = _response$data.deleted; // Delete the docs that have been deleted

                if (!(Array.isArray(deleted) && deleted.length > 0)) {
                  _context10.next = 33;
                  break;
                }

                removeQuery = new _query.default().contains('_id', deleted.map(function (doc) {
                  return doc._id;
                }));
                _context10.next = 33;
                return cache.remove(removeQuery);

              case 33:
                if (!(Array.isArray(changed) && changed.length > 0)) {
                  _context10.next = 36;
                  break;
                }

                _context10.next = 36;
                return cache.save(changed);

              case 36:
                _context10.next = 38;
                return queryCache.save(query, _response);

              case 38:
                return _context10.abrupt("return", changed.length);

              case 39:
                _context10.next = 45;
                break;

              case 41:
                _context10.prev = 41;
                _context10.t0 = _context10["catch"](14);

                if (!(!(_context10.t0 instanceof _missingConfiguration.default) && !(_context10.t0 instanceof _parameterValueOutOfRange.default))) {
                  _context10.next = 45;
                  break;
                }

                throw _context10.t0;

              case 45:
                if (!useAutoPagination) {
                  _context10.next = 62;
                  break;
                }

                _context10.next = 48;
                return cache.clear();

              case 48:
                _context10.next = 50;
                return network.count(query, Object.assign({}, options, {
                  rawResponse: true
                })).toPromise();

              case 50:
                _response2 = _context10.sent;
                _count = 'count' in _response2.data ? _response2.data.count : Infinity; // Create the pages

                pageSize = options.autoPaginationPageSize || options.autoPagination && options.autoPagination.pageSize || PAGE_LIMIT;
                pageCount = Math.ceil(_count / pageSize);
                pageQueries = (0, _times.default)(pageCount, function (i) {
                  var pageQuery = new _query.default(query);
                  pageQuery.skip = i * pageSize;
                  pageQuery.limit = Math.min(_count - i * pageSize, pageSize);
                  return pageQuery;
                }); // Process the pages

                pagePromises = pageQueries.map(function (pageQuery) {
                  return network.find(pageQuery, options).toPromise().then(function (docs) {
                    return cache.save(docs);
                  }).then(function (docs) {
                    return docs.length;
                  });
                });
                _context10.next = 58;
                return Promise.all(pagePromises);

              case 58:
                pageCounts = _context10.sent;
                totalPageCount = pageCounts.reduce(function (totalCount, pageCount) {
                  return totalCount + pageCount;
                }, 0); // Update the query cache

                queryCache.save(query, _response2); // Return the total page count

                return _context10.abrupt("return", totalPageCount);

              case 62:
                _context10.next = 64;
                return network.find(query, Object.assign({}, options, {
                  rawResponse: true
                })).toPromise();

              case 64:
                response = _context10.sent;
                docs = response.data; // Clear the cache if a query was not provided

                if (query) {
                  _context10.next = 69;
                  break;
                }

                _context10.next = 69;
                return cache.clear();

              case 69:
                _context10.next = 71;
                return cache.save(docs);

              case 71:
                _context10.next = 73;
                return queryCache.save(query, response);

              case 73:
                return _context10.abrupt("return", docs.length);

              case 74:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this, [[14, 41]]);
      }));

      function pull(_x10) {
        return _pull.apply(this, arguments);
      }

      return pull;
    }()
  }, {
    key: "pullById",
    value: function () {
      var _pullById = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee11(id) {
        var options,
            network,
            cache,
            count,
            doc,
            _args11 = arguments;
        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                options = _args11.length > 1 && _args11[1] !== undefined ? _args11[1] : {};
                network = new _networkstore.NetworkStore(this.collectionName);
                cache = new _cache.DataStoreCache(this.collectionName, this.tag); // Push sync queue

                _context11.next = 5;
                return this.pendingSyncCount();

              case 5:
                count = _context11.sent;

                if (!(count > 0)) {
                  _context11.next = 10;
                  break;
                }

                if (!(count === 1)) {
                  _context11.next = 9;
                  break;
                }

                throw new _kinvey.default("Unable to pull entities from the backend. There is ".concat(count, " entity") + ' that needs to be pushed to the backend.');

              case 9:
                throw new _kinvey.default("Unable to pull entities from the backend. There are ".concat(count, " entities") + ' that need to be pushed to the backend.');

              case 10:
                _context11.prev = 10;
                _context11.next = 13;
                return network.findById(id, options).toPromise();

              case 13:
                doc = _context11.sent;
                _context11.next = 16;
                return cache.save(doc);

              case 16:
                return _context11.abrupt("return", doc);

              case 19:
                _context11.prev = 19;
                _context11.t0 = _context11["catch"](10);

                if (!(_context11.t0 instanceof _notFound.default)) {
                  _context11.next = 24;
                  break;
                }

                _context11.next = 24;
                return cache.removeById(id);

              case 24:
                throw _context11.t0;

              case 25:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this, [[10, 19]]);
      }));

      function pullById(_x11) {
        return _pullById.apply(this, arguments);
      }

      return pullById;
    }()
  }, {
    key: "sync",
    value: function () {
      var _sync = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee12(query, options) {
        var push, pull;
        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return this.push(null, options);

              case 2:
                push = _context12.sent;
                _context12.next = 5;
                return this.pull(query, options);

              case 5:
                pull = _context12.sent;
                return _context12.abrupt("return", {
                  push: push,
                  pull: pull
                });

              case 7:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function sync(_x12, _x13) {
        return _sync.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: "pendingSyncDocs",
    value: function pendingSyncDocs(query) {
      var sync = new _sync2.Sync(this.collectionName, this.tag);
      var findQuery = (0, _sync2.queryToSyncQuery)(query, this.collectionName);
      return sync.find(findQuery);
    }
  }, {
    key: "pendingSyncEntities",
    value: function pendingSyncEntities(query) {
      return this.pendingSyncDocs(query);
    }
  }, {
    key: "pendingSyncCount",
    value: function pendingSyncCount(query) {
      var sync = new _sync2.Sync(this.collectionName, this.tag);
      var findQuery = (0, _sync2.queryToSyncQuery)(query, this.collectionName);
      return sync.count(findQuery);
    }
  }, {
    key: "clearSync",
    value: function () {
      var _clearSync = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee13(query) {
        var sync, clearQuery;
        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                sync = new _sync2.Sync(this.collectionName, this.tag);
                clearQuery = (0, _sync2.queryToSyncQuery)(query, this.collectionName);
                return _context13.abrupt("return", sync.remove(clearQuery));

              case 3:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function clearSync(_x14) {
        return _clearSync.apply(this, arguments);
      }

      return clearSync;
    }()
  }, {
    key: "subscribe",
    value: function () {
      var _subscribe = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee14(receiver) {
        var network;
        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                network = new _networkstore.NetworkStore(this.collectionName);
                _context14.next = 3;
                return network.subscribe(receiver);

              case 3:
                return _context14.abrupt("return", this);

              case 4:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function subscribe(_x15) {
        return _subscribe.apply(this, arguments);
      }

      return subscribe;
    }()
  }, {
    key: "unsubscribe",
    value: function () {
      var _unsubscribe = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee15() {
        var network;
        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                network = new _networkstore.NetworkStore(this.collectionName);
                _context15.next = 3;
                return network.unsubscribe();

              case 3:
                return _context15.abrupt("return", this);

              case 4:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function unsubscribe() {
        return _unsubscribe.apply(this, arguments);
      }

      return unsubscribe;
    }()
  }, {
    key: "pathname",
    get: function get() {
      var _getConfig2 = (0, _config.get)(),
          appKey = _getConfig2.appKey;

      return "/".concat(NAMESPACE, "/").concat(appKey, "/").concat(this.collectionName);
    }
  }]);
  return CacheStore;
}();

exports.CacheStore = CacheStore;
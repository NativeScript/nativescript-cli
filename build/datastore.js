'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = exports.DataStore = exports.DataStoreType = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// import assign from 'lodash/assign';


var _errors = require('./errors');

var _cache = require('./requests/cache');

var _cache2 = _interopRequireDefault(_cache);

var _deltafetch = require('./requests/deltafetch');

var _network = require('./requests/network');

var _enums = require('./enums');

var _query4 = require('./query');

var _Observable = require('rxjs/Observable');

var _toPromise = require('rxjs/operator/toPromise');

var _metadata = require('./metadata');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _sync = require('./sync');

var _sync2 = _interopRequireDefault(_sync);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _xorWith = require('lodash/xorWith');

var _xorWith2 = _interopRequireDefault(_xorWith);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
// const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
// const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
// const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';
var cacheEnabledSymbol = Symbol();
var onlineSymbol = Symbol();

/**
 * Enum for DataStore types.
 */
var DataStoreType = {
  Sync: 'Sync',
  Network: 'Network',
  User: 'User',
  File: 'File'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

/**
 * The DataStore class is used to find, save, update, remove, count and group entities.
 */

var DataStore = function () {
  function DataStore(collection) {
    _classCallCheck(this, DataStore);

    if (collection && !(0, _isString2.default)(collection)) {
      throw new _errors.KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Number|undefined}
     */
    this.ttl = undefined;

    /**
     * @type {Boolean}
     */
    this.useDeltaFetch = false;

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();

    /**
     * @type {Sync}
     */
    this.sync = new _sync2.default();
    this.sync.client = this.client;

    // Enable the cache
    this.enableCache();

    // Make the store online
    this.online();
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}  Pathname
   */


  _createClass(DataStore, [{
    key: 'disableCache',


    /**
     * Disable cache.
     *
     * @return {DataStore}  DataStore instance.
     */
    value: function disableCache() {
      if (!this.isOnline()) {
        throw new _errors.KinveyError('Unable to disable the cache when the store is offline. Please make the store ' + 'online by calling `store.online()`.');
      }

      this[cacheEnabledSymbol] = false;
      return this;
    }

    /**
     * Enable cache.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'enableCache',
    value: function enableCache() {
      this[cacheEnabledSymbol] = true;
      return this;
    }

    /**
     * Check if cache is enabled.
     *
     * @return {Boolean}  True of false depending on if cache is enabled or disabled.
     */

  }, {
    key: 'isCacheEnabled',
    value: function isCacheEnabled() {
      return this[cacheEnabledSymbol];
    }

    /**
     * Make the store offline.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'offline',
    value: function offline() {
      if (!this.isCacheEnabled()) {
        throw new _errors.KinveyError('Unable to go offline when the cache for the store is disabled. Please enable the cache ' + 'by calling `store.enableCache()`.');
      }

      this[onlineSymbol] = false;
      return this;
    }

    /**
     * Make the store online.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'online',
    value: function online() {
      this[onlineSymbol] = true;
      return this;
    }

    /**
     * Check if the store is online.
     *
     * @return {Boolean}  True of false depending on if the store is online or offline.
     */

  }, {
    key: 'isOnline',
    value: function isOnline() {
      return this[onlineSymbol];
    }

    /**
     * Finds all entities in a collection. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                                   Query used to filter result.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.\
     * @param   {Boolean}               [options.useDeltaFetch]                   Turn on or off the use of delta fetch
     *                                                                            for the find.
     * @return  {Promise|Object}                                                  Promise or object.
     */

  }, {
    key: 'find',
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(observer) {
          var syncQuery, cacheData, networkData, count, request, response, useDeltaFetch, requestOptions, _request, _response, removedData, removedIds, removeQuery, _request2;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  syncQuery = new _query4.Query().equalTo('collection', _this.collection);
                  cacheData = [];
                  networkData = [];

                  // Check that the query is valid

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context.next = 6;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 6:
                  if (!_this.isCacheEnabled()) {
                    _context.next = 24;
                    break;
                  }

                  _context.next = 9;
                  return _this.syncCount(syncQuery);

                case 9:
                  count = _context.sent;

                  if (!(count > 0)) {
                    _context.next = 16;
                    break;
                  }

                  _context.next = 13;
                  return _this.push(syncQuery);

                case 13:
                  _context.next = 15;
                  return _this.syncCount(syncQuery);

                case 15:
                  count = _context.sent;

                case 16:
                  if (!(count > 0)) {
                    _context.next = 18;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data is loaded from the network.');

                case 18:
                  request = new _cache2.default({
                    method: _enums.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this.client.protocol,
                      host: _this.client.host,
                      pathname: _this.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  _context.next = 21;
                  return request.execute();

                case 21:
                  response = _context.sent;

                  cacheData = response.data;
                  observer.next(cacheData);

                case 24:
                  if (!_this.isOnline()) {
                    _context.next = 43;
                    break;
                  }

                  useDeltaFetch = options.useDeltaFetch || !!_this.useDeltaFetch;
                  requestOptions = {
                    method: _enums.RequestMethod.GET,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this.client.protocol,
                      host: _this.client.host,
                      pathname: _this.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this.client
                  };
                  _request = new _network.NetworkRequest(requestOptions);

                  // Should we use delta fetch?

                  if (useDeltaFetch) {
                    _request = new _deltafetch.DeltaFetchRequest(requestOptions);
                  }

                  _context.next = 31;
                  return _request.execute();

                case 31:
                  _response = _context.sent;

                  networkData = _response.data;

                  if (!_this.isCacheEnabled()) {
                    _context.next = 42;
                    break;
                  }

                  // Remove data from the cache that no longer exists on the network and
                  // update the cache with data from the network
                  removedData = (0, _differenceBy2.default)(cacheData, networkData, idAttribute);
                  removedIds = Object.keys((0, _keyBy2.default)(removedData, idAttribute));
                  removeQuery = new _query4.Query().contains(idAttribute, removedIds);
                  _request2 = new _cache2.default({
                    method: _enums.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this.client.protocol,
                      host: _this.client.host,
                      pathname: _this.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: removeQuery,
                    timeout: options.timeout
                  });
                  _context.next = 40;
                  return _request2.execute();

                case 40:
                  _context.next = 42;
                  return _this.updateCache(networkData);

                case 42:

                  observer.next(networkData);

                case 43:
                  _context.next = 48;
                  break;

                case 45:
                  _context.prev = 45;
                  _context.t0 = _context['catch'](0);
                  return _context.abrupt('return', observer.error(_context.t0));

                case 48:
                  return _context.abrupt('return', observer.complete());

                case 49:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this, [[0, 45]]);
        }));

        return function (_x2) {
          return ref.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: 'findById',
    value: function findById(id) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(observer) {
          var syncQuery, count, request, response, useDeltaFetch, requestOptions, _request3, _response2, data, _request4;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;

                  if (id) {
                    _context2.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context2.next = 23;
                  break;

                case 5:
                  if (!_this2.isCacheEnabled()) {
                    _context2.next = 23;
                    break;
                  }

                  syncQuery = new _query4.Query().equalTo('collection', _this2.collection);
                  _context2.next = 9;
                  return _this2.syncCount(syncQuery);

                case 9:
                  count = _context2.sent;

                  if (!(count > 0)) {
                    _context2.next = 16;
                    break;
                  }

                  _context2.next = 13;
                  return _this2.push(syncQuery);

                case 13:
                  _context2.next = 15;
                  return _this2.syncCount(syncQuery);

                case 15:
                  count = _context2.sent;

                case 16:
                  if (!(count > 0)) {
                    _context2.next = 18;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data can be loaded.');

                case 18:
                  request = new _cache2.default({
                    method: _enums.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  _context2.next = 21;
                  return request.execute();

                case 21:
                  response = _context2.sent;

                  observer.next(response.data);

                case 23:
                  if (!_this2.isOnline()) {
                    _context2.next = 45;
                    break;
                  }

                  useDeltaFetch = options.useDeltaFetch || !!_this2.useDeltaFetch;
                  requestOptions = {
                    method: _enums.RequestMethod.GET,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: _this2.client
                  };
                  _request3 = new _network.NetworkRequest(requestOptions);


                  if (useDeltaFetch) {
                    _request3 = new _deltafetch.DeltaFetchRequest(requestOptions);
                  }

                  _context2.prev = 28;
                  _context2.next = 31;
                  return _request3.execute();

                case 31:
                  _response2 = _context2.sent;
                  data = _response2.data;

                  observer.next(data);
                  _context2.next = 36;
                  return _this2.updateCache(data);

                case 36:
                  _context2.next = 45;
                  break;

                case 38:
                  _context2.prev = 38;
                  _context2.t0 = _context2['catch'](28);

                  if (!(_context2.t0 instanceof _errors.NotFoundError)) {
                    _context2.next = 44;
                    break;
                  }

                  _request4 = new _cache2.default({
                    method: _enums.RequestMethod.DELETE,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  _context2.next = 44;
                  return _request4.execute();

                case 44:
                  throw _context2.t0;

                case 45:
                  _context2.next = 50;
                  break;

                case 47:
                  _context2.prev = 47;
                  _context2.t1 = _context2['catch'](0);
                  return _context2.abrupt('return', observer.error(_context2.t1));

                case 50:
                  return _context2.abrupt('return', observer.complete());

                case 51:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this2, [[0, 47], [28, 38]]);
        }));

        return function (_x4) {
          return ref.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(observer) {
          var syncQuery, count, request, response, data, _request5, _response3, _data;

          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!_this3.isCacheEnabled()) {
                    _context3.next = 20;
                    break;
                  }

                  syncQuery = new _query4.Query().equalTo('collection', _this3.collection);
                  _context3.next = 5;
                  return _this3.syncCount(syncQuery);

                case 5:
                  count = _context3.sent;

                  if (!(count > 0)) {
                    _context3.next = 12;
                    break;
                  }

                  _context3.next = 9;
                  return _this3.push(syncQuery);

                case 9:
                  _context3.next = 11;
                  return _this3.syncCount(syncQuery);

                case 11:
                  count = _context3.sent;

                case 12:
                  if (!(count > 0)) {
                    _context3.next = 14;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to count data. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data is counted.');

                case 14:
                  request = new _cache2.default({
                    method: _enums.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this3.client.protocol,
                      host: _this3.client.host,
                      pathname: _this3.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  _context3.next = 17;
                  return request.execute();

                case 17:
                  response = _context3.sent;
                  data = response.data;

                  observer.next(data ? data.count : 0);

                case 20:
                  if (!_this3.isOnline()) {
                    _context3.next = 27;
                    break;
                  }

                  _request5 = new _network.NetworkRequest({
                    method: _enums.RequestMethod.GET,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this3.client.protocol,
                      host: _this3.client.host,
                      pathname: _this3.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this3.client
                  });
                  _context3.next = 24;
                  return _request5.execute();

                case 24:
                  _response3 = _context3.sent;
                  _data = _response3.data;

                  observer.next(_data ? _data.count : 0);

                case 27:
                  _context3.next = 32;
                  break;

                case 29:
                  _context3.prev = 29;
                  _context3.t0 = _context3['catch'](0);
                  return _context3.abrupt('return', observer.error(_context3.t0));

                case 32:
                  return _context3.abrupt('return', observer.complete());

                case 33:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3, [[0, 29]]);
        }));

        return function (_x6) {
          return ref.apply(this, arguments);
        };
      }());

      return _toPromise.toPromise.call(stream);
    }
  }, {
    key: 'create',
    value: function create(data) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(observer) {
          var singular, request, response, ids, query, push, _request6, _response4;

          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;
                  singular = false;

                  if (data) {
                    _context4.next = 6;
                    break;
                  }

                  observer.next(null);
                  _context4.next = 31;
                  break;

                case 6:
                  if (!_this4.isCacheEnabled()) {
                    _context4.next = 26;
                    break;
                  }

                  request = new _cache2.default({
                    method: _enums.RequestMethod.POST,
                    url: _url2.default.format({
                      protocol: _this4.client.protocol,
                      host: _this4.client.host,
                      pathname: _this4.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });
                  _context4.next = 10;
                  return request.execute();

                case 10:
                  response = _context4.sent;

                  data = response.data;

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  _context4.next = 15;
                  return Promise.all((0, _map2.default)(data, function (entity) {
                    return _this4.sync.addCreateOperation(_this4.collection, entity, options);
                  }));

                case 15:
                  if (!_this4.isOnline()) {
                    _context4.next = 23;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context4.next = 20;
                  return _this4.push(query, options);

                case 20:
                  push = _context4.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 23:

                  observer.next(singular ? data[0] : data);
                  _context4.next = 31;
                  break;

                case 26:
                  _request6 = new _network.NetworkRequest({
                    method: _enums.RequestMethod.POST,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this4.client.protocol,
                      host: _this4.client.host,
                      pathname: _this4.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    data: data,
                    timeout: options.timeout,
                    client: _this4.client
                  });
                  _context4.next = 29;
                  return _request6.execute();

                case 29:
                  _response4 = _context4.sent;

                  observer.next(_response4.data);

                case 31:
                  _context4.next = 36;
                  break;

                case 33:
                  _context4.prev = 33;
                  _context4.t0 = _context4['catch'](0);
                  return _context4.abrupt('return', observer.error(_context4.t0));

                case 36:
                  return _context4.abrupt('return', observer.complete());

                case 37:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this4, [[0, 33]]);
        }));

        return function (_x8) {
          return ref.apply(this, arguments);
        };
      }());

      return _toPromise.toPromise.call(stream);
    }
  }, {
    key: 'update',
    value: function update(data) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var observable = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(observer) {
          var singular, id, _request7, _response5, ids, query, push, request, response;

          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.prev = 0;
                  singular = false;
                  id = data[idAttribute];

                  if (data) {
                    _context5.next = 6;
                    break;
                  }

                  observer.next(null);
                  return _context5.abrupt('return', observer.complete());

                case 6:
                  if (!_this5.isCacheEnabled()) {
                    _context5.next = 25;
                    break;
                  }

                  _request7 = new _cache2.default({
                    method: _enums.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this5.client.protocol,
                      host: _this5.client.host,
                      pathname: id ? _this5.pathname + '/' + id : _this5.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });
                  _context5.next = 10;
                  return _request7.execute();

                case 10:
                  _response5 = _context5.sent;

                  data = _response5.data;

                  if (!_this5.isOnline()) {
                    _context5.next = 23;
                    break;
                  }

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  _context5.next = 16;
                  return Promise.all((0, _map2.default)(data, function (entity) {
                    return _this5.sync.addUpdateOperation(_this5.collection, entity, options);
                  }));

                case 16:
                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context5.next = 20;
                  return _this5.push(query, options);

                case 20:
                  push = _context5.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 23:

                  observer.next(singular ? data[0] : data);
                  return _context5.abrupt('return', observer.complete());

                case 25:
                  request = new _network.NetworkRequest({
                    method: _enums.RequestMethod.POST,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this5.client.protocol,
                      host: _this5.client.host,
                      pathname: id ? _this5.pathname + '/' + id : _this5.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    data: data,
                    timeout: options.timeout,
                    client: _this5.client
                  });
                  _context5.next = 28;
                  return request.execute();

                case 28:
                  response = _context5.sent;

                  observer.next(response.data);
                  _context5.next = 35;
                  break;

                case 32:
                  _context5.prev = 32;
                  _context5.t0 = _context5['catch'](0);

                  observer.error(_context5.t0);

                case 35:
                  return _context5.abrupt('return', observer.complete());

                case 36:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this5, [[0, 32]]);
        }));

        return function (_x10) {
          return ref.apply(this, arguments);
        };
      }());

      return observable;
    }
  }, {
    key: 'save',
    value: function save(data, options) {
      if (data[idAttribute]) {
        return this.update(data, options);
      }

      return this.create(data, options);
    }
  }, {
    key: 'remove',
    value: function remove(query) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(observer) {
          var request, response, data, localData, _query, syncData, ids, _query2, push, _request8, _response6;

          return regeneratorRuntime.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context6.next = 5;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 5:
                  if (!_this6.isCacheEnabled()) {
                    _context6.next = 29;
                    break;
                  }

                  request = new _cache2.default({
                    method: _enums.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this6.client.protocol,
                      host: _this6.client.host,
                      pathname: _this6.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: _query, // eslint-disable-line no-use-before-define
                    timeout: options.timeout
                  });
                  _context6.next = 9;
                  return request.execute();

                case 9:
                  response = _context6.sent;
                  data = response.data;

                  // Clear local data from the sync table

                  localData = (0, _filter2.default)(data, function (entity) {
                    var metadata = new _metadata.Metadata(entity);
                    return metadata.isLocal();
                  });
                  _query = new _query4.Query().contains('entityId', Object.keys((0, _keyBy2.default)(localData, idAttribute)));
                  _context6.next = 15;
                  return _this6.sync.clear(_query, options);

                case 15:

                  // Create delete operations for non local data in the sync table
                  syncData = (0, _xorWith2.default)(data, localData, function (entity, localEntity) {
                    return entity[idAttribute] === localEntity[idAttribute];
                  });
                  _context6.next = 18;
                  return _this6.sync.addDeleteOperation(_this6.collection, syncData, options);

                case 18:
                  if (!_this6.isOnline()) {
                    _context6.next = 26;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(syncData, idAttribute));
                  _query2 = new _query4.Query().contains('entityId', ids);
                  _context6.next = 23;
                  return _this6.push(_query2, options);

                case 23:
                  push = _context6.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 26:

                  observer.next(data);
                  _context6.next = 34;
                  break;

                case 29:
                  _request8 = new _network.NetworkRequest({
                    method: _enums.RequestMethod.DELETE,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this6.client.protocol,
                      host: _this6.client.host,
                      pathname: _this6.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this6.client
                  });
                  _context6.next = 32;
                  return _request8.execute();

                case 32:
                  _response6 = _context6.sent;

                  observer.next(_response6.data);

                case 34:
                  _context6.next = 39;
                  break;

                case 36:
                  _context6.prev = 36;
                  _context6.t0 = _context6['catch'](0);
                  return _context6.abrupt('return', observer.error(_context6.t0));

                case 39:
                  return _context6.abrupt('return', observer.complete());

                case 40:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this6, [[0, 36]]);
        }));

        return function (_x12) {
          return ref.apply(this, arguments);
        };
      }());

      return _toPromise.toPromise.call(stream);
    }
  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _Observable.Observable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(observer) {
          var request, response, data, metadata, query, _query3, push, _request9, _response7;

          return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.prev = 0;

                  if (id) {
                    _context7.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context7.next = 34;
                  break;

                case 5:
                  if (!_this7.isCacheEnabled()) {
                    _context7.next = 31;
                    break;
                  }

                  request = new _cache2.default({
                    method: _enums.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this7.client.protocol,
                      host: _this7.client.host,
                      pathname: _this7.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    authType: _enums.AuthType.Default,
                    timeout: options.timeout
                  });
                  _context7.next = 9;
                  return request.execute();

                case 9:
                  response = _context7.sent;
                  data = response.data;
                  metadata = new _metadata.Metadata(data);

                  if (!metadata.isLocal()) {
                    _context7.next = 19;
                    break;
                  }

                  query = new _query4.Query();

                  query.equalTo('entityId', data[idAttribute]);
                  _context7.next = 17;
                  return _this7.sync.clear(_this7.collection, query, options);

                case 17:
                  _context7.next = 21;
                  break;

                case 19:
                  _context7.next = 21;
                  return _this7.sync.addDeleteOperation(_this7.collection, data, options);

                case 21:
                  if (!_this7.isOnline()) {
                    _context7.next = 28;
                    break;
                  }

                  _query3 = new _query4.Query().equalTo('entityId', data[idAttribute]);
                  _context7.next = 25;
                  return _this7.push(_query3, options);

                case 25:
                  push = _context7.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 28:

                  observer.next(data);
                  _context7.next = 34;
                  break;

                case 31:
                  _request9 = new _network.NetworkRequest({
                    method: _enums.RequestMethod.DELETE,
                    authType: _enums.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this7.client.protocol,
                      host: _this7.client.host,
                      pathname: _this7.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  _response7 = _request9.execute();

                  observer.next(_response7.data);

                case 34:
                  _context7.next = 39;
                  break;

                case 36:
                  _context7.prev = 36;
                  _context7.t0 = _context7['catch'](0);
                  return _context7.abrupt('return', observer.error(_context7.t0));

                case 39:
                  return _context7.abrupt('return', observer.complete());

                case 40:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this7, [[0, 36]]);
        }));

        return function (_x14) {
          return ref.apply(this, arguments);
        };
      }());

      return _toPromise.toPromise.call(stream);
    }

    /**
     * Push sync items for a collection to the network. A promise will be returned that will be
     * resolved with the result of the push or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to push a subset of items.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var store = Kinvey.DataStore.getInstance('books');
     * store.push().then(function(result) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'push',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (this.isCacheEnabled()) {
                  _context8.next = 2;
                  break;
                }

                throw new _errors.KinveyError('The cache is disabled for this store.');

              case 2:

                if (!(query instanceof _query4.Query)) {
                  query = new _query4.Query((0, _result2.default)(query, 'toJSON', query));
                }

                query.equalTo('collection', this.collection);
                return _context8.abrupt('return', this.sync.push(query, options));

              case 5:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function push(_x15, _x16) {
        return ref.apply(this, arguments);
      }

      return push;
    }()

    /**
     * Pull items for a collection from the network to your local cache. A promise will be
     * returned that will be resolved with the result of the pull or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to pull a subset of items.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var store = Kinvey.Store.getInstance('books');
     * store.pull().then(function(result) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'pull',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var count;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.syncCount(null, options);

              case 2:
                count = _context9.sent;

                if (!(count > 0)) {
                  _context9.next = 5;
                  break;
                }

                throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');

              case 5:
                return _context9.abrupt('return', this.find(query, options).then(function (result) {
                  return result.networkPromise;
                }));

              case 6:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function pull(_x18, _x19) {
        return ref.apply(this, arguments);
      }

      return pull;
    }()

    /**
     * Sync items for a collection. This will push pending sync items first and then
     * pull items from the network into your local cache. A promise will be
     * returned that will be resolved with the result of the pull or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to pull a subset of items.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var store = Kinvey.Store.getInstance('books');
     * store.sync().then(function(result) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'sync',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var push, pull;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.push(null, options);

              case 2:
                push = _context10.sent;
                _context10.next = 5;
                return this.pull(query, options);

              case 5:
                pull = _context10.sent;
                return _context10.abrupt('return', {
                  push: push,
                  pull: pull
                });

              case 7:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function sync(_x21, _x22) {
        return ref.apply(this, arguments);
      }

      return sync;
    }()

    /**
     * Count the number of entities waiting to be pushed to the network. A promise will be
     * returned with the count of entities or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to count a subset of entities.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data retrieved
     *                                                                            from the local cache.
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var store = Kinvey.Store.getInstance('books');
     * store.syncCount().then(function(count) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'syncCount',
    value: function syncCount(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!(query instanceof _query4.Query)) {
        query = new _query4.Query((0, _result2.default)(query, 'toJSON', query));
      }

      query.equalTo('collection', this.collection);
      return this.sync.count(query, options);
    }

    /**
     * Add or update entities stored in the cache. A promise will be returned with the entities
     * or rejected with an error.
     *
     * @param   {Object|Array}          entities                                  Entity(s) to add or update in the cache.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'updateCache',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, response;
        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                request = new _cache2.default({
                  method: _enums.RequestMethod.PUT,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  data: entities,
                  timeout: options.timeout
                });
                _context11.next = 3;
                return request.execute();

              case 3:
                response = _context11.sent;
                return _context11.abrupt('return', response.data);

              case 5:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function updateCache(_x25, _x26) {
        return ref.apply(this, arguments);
      }

      return updateCache;
    }()

    /**
     * Returns an instance of the Store class based on the type provided.
     *
     * @param  {string}       [collection]                  Name of the collection.
     * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
     * @return {DataStore}                                  DataStore instance.
     */

  }, {
    key: 'pathname',
    get: function get() {
      var pathname = '/' + appdataNamespace;

      if (this.client) {
        pathname = pathname + '/' + this.client.appKey;
      }

      if (this.collection) {
        pathname = pathname + '/' + this.collection;
      }

      return pathname;
    }
  }], [{
    key: 'collection',
    value: function collection(_collection) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Network : arguments[1];

      var store = new DataStore(_collection);
      store.enableCache();

      switch (type) {
        case DataStoreType.Sync:
          store.offline();
          break;
        case DataStoreType.Network:
        default:
          store.online();
      }

      return store;
    }
  }]);

  return DataStore;
}();

// /**
//  * The UserStore class is used to find, save, update, remove, count and group users.
//  */
// export class UserStore extends DataStore {
//   /**
//    * The pathname for the store.
//    *
//    * @return  {string}   Pathname
//    */
//   get pathname() {
//     return `/${usersNamespace}/${this.client.appKey}`;
//   }

//   save(user, options = {}) {
//     const promise = Promise.resolve().then(() => {
//       if (!user) {
//         throw new KinveyError('No user was provided to be updated.');
//       }

//       if (isArray(user)) {
//         throw new KinveyError('Please only update one user at a time.', user);
//       }

//       if (!user[idAttribute]) {
//         throw new KinveyError('User must have an _id.');
//       }

//       if (options._identity) {
//         const socialIdentity = user[socialIdentityAttribute];
//         if (socialIdentity) {
//           for (const [key] of socialIdentity) {
//             if (socialIdentity[key] && options._identity !== key) {
//               delete socialIdentity[key];
//             }
//           }
//         }
//       }

//       return super.save(user, options);
//     });

//     return promise;
//   }

//   exists(username, options) {
//     const request = new NetworkRequest({
//       method: HttpMethod.POST,
//       authType: AuthType.App,
//       url: url.format({
//         protocol: this.client.protocol,
//         host: this.client.host,
//         pathname: `/${rpcNamespace}/${this.client.appKey}/check-username-exists`
//       }),
//       properties: options.properties,
//       data: { username: username },
//       timeout: options.timeout,
//       client: this.client
//     });

//     const promise = request.execute().then(response => response.data.usernameExists);
//     return promise;
//   }

//   restore(id, options = {}) {
//     const request = new NetworkRequest({
//       method: HttpMethod.POST,
//       authType: AuthType.Master,
//       url: url.format({
//         protocol: this.client.protocol,
//         host: this.client.host,
//         pathname: `${this.pathname}/id`
//       }),
//       properties: options.properties,
//       timeout: options.timeout,
//       client: this.client
//     });

//     const promise = request.execute().then(response => response.data);
//     return promise;
//   }
// }

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */


exports.DataStore = DataStore;

var FileStore = exports.FileStore = function (_DataStore) {
  _inherits(FileStore, _DataStore);

  function FileStore() {
    _classCallCheck(this, FileStore);

    var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(FileStore).call(this));

    _this8.disableCache();
    return _this8;
  }

  /**
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */


  _createClass(FileStore, [{
    key: 'enableCache',
    value: function enableCache() {}
    // Log a warning
    // throw new KinveyError('Unable to enable cache for the file store.');


    /**
     * Make the store offline.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'offline',
    value: function offline() {}
    // Log a warning
    // throw new KinveyError('Unable to go offline for the file store.');


    /**
     * The pathname for the store.
     *
     * @return  {string}  Pathname
     */

  }, {
    key: 'find',


    /**
     * Finds all files. A query can be optionally provided to return
     * a subset of all the files for your application or omitted to return all the files.
     * The number of files returned will adhere to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
     * promise will be returned that will be resolved with the files or rejected with
     * an error.
     *
     * @param   {Query}                 [query]                                   Query used to filter result.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Boolean}               [options.tls]                             Use Transport Layer Security
     * @param   {Boolean}               [options.download]                        Download the files
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var filesStore = new Kinvey.FilesStore();
     * var query = new Kinvey.Query();
     * query.equalTo('location', 'Boston');
     * files.find(query, {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     *   download: true // download the files
     * }).then(function(files) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(query) {
        var _this9 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var stream, files;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;
                options.ttl_in_seconds = options.ttl;

                stream = _get(Object.getPrototypeOf(FileStore.prototype), 'find', this).call(this, query, options);
                _context12.next = 6;
                return _toPromise.toPromise.call(stream);

              case 6:
                files = _context12.sent;

                if (!(options.download === true)) {
                  _context12.next = 9;
                  break;
                }

                return _context12.abrupt('return', Promise.all((0, _map2.default)(files, function (file) {
                  return _this9.downloadByUrl(file._downloadURL, options);
                })));

              case 9:
                return _context12.abrupt('return', files);

              case 10:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function find(_x29, _x30) {
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function findById(id, options) {
      return this.download(id, options);
    }

    /**
     * Download a file. A promise will be returned that will be resolved with the file or rejected with
     * an error.
     *
     * @param   {string}        name                                          Name
     * @param   {Object}        [options]                                     Options
     * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
     * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
     * @param   {Boolean}       [options.stream]                              Stream the file
     * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
     * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
     * @return  {Promise}                                                     Promise
     *
     * @example
     * var files = new Kinvey.Files();
     * files.download('BostonTeaParty.png', {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     *   stream: true // stream the file
     * }).then(function(file) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
    */

  }, {
    key: 'download',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(name) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var stream, file;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;
                options.ttl_in_seconds = options.ttl;

                stream = _get(Object.getPrototypeOf(FileStore.prototype), 'findById', this).call(this, name, options);
                _context13.next = 6;
                return _toPromise.toPromise.call(stream);

              case 6:
                file = _context13.sent;

                if (!(options.stream === true)) {
                  _context13.next = 9;
                  break;
                }

                return _context13.abrupt('return', file);

              case 9:
                return _context13.abrupt('return', this.downloadByUrl(file._downloadURL, options));

              case 10:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function download(_x32, _x33) {
        return ref.apply(this, arguments);
      }

      return download;
    }()
  }, {
    key: 'downloadByUrl',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(url) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, response;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                request = new _network.NetworkRequest({
                  method: _enums.RequestMethod.GET,
                  url: url,
                  timeout: options.timeout
                });

                request.setHeader('Accept', options.mimeType || 'application-octet-stream');
                request.removeHeader('Content-Type');
                request.removeHeader('X-Kinvey-Api-Version');
                _context14.next = 6;
                return request.execute();

              case 6:
                response = _context14.sent;
                return _context14.abrupt('return', response.data);

              case 8:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function downloadByUrl(_x35, _x36) {
        return ref.apply(this, arguments);
      }

      return downloadByUrl;
    }()

    /**
     * Stream a file. A promise will be returned that will be resolved with the file or rejected with
     * an error.
     *
     * @param   {string}        name                                          File name
     * @param   {Object}        [options]                                     Options
     * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
     * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
     * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
     * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
     * @return  {Promise}                                                     Promise
     *
     * @example
     * var files = new Kinvey.Files();
     * files.stream('BostonTeaParty.png', {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     * }).then(function(file) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'stream',
    value: function stream(name) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.stream = true;
      return this.download(name, options);
    }
  }, {
    key: 'upload',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(file) {
        var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var createRequest, createResponse, data, uploadUrl, headers, uploadRequest;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                metadata._filename = metadata._filename || file._filename || file.name;
                metadata.size = metadata.size || file.size || file.length;
                metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

                if (options.public === true) {
                  metadata._public = true;
                }

                createRequest = new _network.NetworkRequest({
                  method: _enums.RequestMethod.POST,
                  headers: {
                    'X-Kinvey-Content-Type': metadata.mimeType
                  },
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  data: metadata,
                  client: this.client
                });


                if (metadata[idAttribute]) {
                  createRequest.method = _enums.RequestMethod.PUT;
                  createRequest.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + metadata._id,
                    query: options.query
                  });
                }

                _context15.next = 8;
                return createRequest.execute();

              case 8:
                createResponse = _context15.sent;
                data = createResponse.data;
                uploadUrl = data._uploadURL;
                headers = data._requiredHeaders || {};

                headers['Content-Type'] = metadata.mimeType;
                headers['Content-Length'] = metadata.size;

                // Delete fields from the response
                delete data._expiresAt;
                delete data._requiredHeaders;
                delete data._uploadURL;

                // Upload the file
                uploadRequest = new _network.NetworkRequest({
                  method: _enums.RequestMethod.PUT,
                  url: uploadUrl,
                  data: file
                });

                uploadRequest.clearHeaders();
                uploadRequest.addHeaders(headers);
                _context15.next = 22;
                return uploadRequest.execute();

              case 22:

                data._data = file;
                return _context15.abrupt('return', data);

              case 24:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function upload(_x39, _x40, _x41) {
        return ref.apply(this, arguments);
      }

      return upload;
    }()
  }, {
    key: 'save',
    value: function save() {
      return Promise.reject(new _errors.KinveyError('Please use `upload()` to save files.'));
    }
  }, {
    key: 'update',
    value: function update() {
      return Promise.reject(new _errors.KinveyError('Please use `upload()` to update files.'));
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + filesNamespace + '/' + this.client.appKey;
    }
  }]);

  return FileStore;
}(DataStore);
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStore = exports.DataStoreType = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
/* eslint-disable no-underscore-dangle */


var _errors = require('./errors');

var _cache = require('./requests/cache');

var _cache2 = _interopRequireDefault(_cache);

var _deltafetch = require('./requests/deltafetch');

var _network = require('./requests/network');

var _request8 = require('./requests/request');

var _query4 = require('./query');

var _observable = require('./utils/observable');

var _metadata = require('./metadata');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _es6Symbol = require('es6-symbol');

var _es6Symbol2 = _interopRequireDefault(_es6Symbol);

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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var cacheEnabledSymbol = (0, _es6Symbol2.default)();
var onlineSymbol = (0, _es6Symbol2.default)();

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
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
     * @type {number|undefined}
     */
    this.ttl = undefined;

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = false;

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();

    /**
     * @private
     * @type {Sync}
     */
    this.dataStoreSync = new _sync2.default();
    this.dataStoreSync.client = this.client;

    // The store is online and has the cache enabled by default.
    this.online();
    this.enableCache();
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */


  _createClass(DataStore, [{
    key: 'disableCache',


    /**
     * Disable the cache for the data store.
     * @return  {DataStore}  DataStore instance.
     */
    value: function disableCache() {
      if (!this.isOnline()) {
        throw new _errors.KinveyError('Unable to disable the cache when the store is offline. Please make the store ' + 'online by calling `store.online()`.');
      }

      this[cacheEnabledSymbol] = false;
      return this;
    }

    /**
     * Enable the cache for the data store.
     * @return  {DataStore}  DataStore instance.
     */

  }, {
    key: 'enableCache',
    value: function enableCache() {
      this[cacheEnabledSymbol] = true;
      return this;
    }

    /**
     * Check if the cache is enabled or disabled for the data store.
     * @return  {Boolean}  True or false depending on if the cache is enabled or disabled.
     */

  }, {
    key: 'isCacheEnabled',
    value: function isCacheEnabled() {
      return this[cacheEnabledSymbol];
    }

    /**
     * Make the data store go offline.
     * @return  {DataStore}  DataStore instance.
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
     * Make the data store go online.
     * @return  {DataStore}  DataStore instance.
     */

  }, {
    key: 'online',
    value: function online() {
      this[onlineSymbol] = true;
      return this;
    }

    /**
     * Check if the data store is online or offline.
     * @return  {Boolean}  True or false depending on if the data store is online or offline.
     */

  }, {
    key: 'isOnline',
    value: function isOnline() {
      return this[onlineSymbol];
    }

    /**
     * Find all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                             Query used to filter entities.
     * @param   {Object}                [options]                           Options
     * @param   {Properties}            [options.properties]                Custom properties to send with
     *                                                                      the request.
     * @param   {Number}                [options.timeout]                   Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
     * @return  {Observable}                                                Observable.
     */

  }, {
    key: 'find',
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(observer) {
          var cacheData, networkData, count, config, request, response, useDeltaFetch, _config, _request, _response, removedData, removedIds, removeQuery, _config2, _request2;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  cacheData = [];
                  networkData = [];

                  // Check that the query is valid

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context.next = 4;
                    break;
                  }

                  return _context.abrupt('return', observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.')));

                case 4:
                  _context.prev = 4;

                  if (!_this.isCacheEnabled()) {
                    _context.next = 25;
                    break;
                  }

                  if (!_this.isOnline()) {
                    _context.next = 18;
                    break;
                  }

                  _context.next = 9;
                  return _this.syncCount();

                case 9:
                  count = _context.sent;

                  if (!(count > 0)) {
                    _context.next = 16;
                    break;
                  }

                  _context.next = 13;
                  return _this.push();

                case 13:
                  _context.next = 15;
                  return _this.syncCount();

                case 15:
                  count = _context.sent;

                case 16:
                  if (!(count > 0)) {
                    _context.next = 18;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data is loaded from the network.');

                case 18:
                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
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
                  request = new _cache2.default(config);
                  _context.next = 22;
                  return request.execute();

                case 22:
                  response = _context.sent;

                  cacheData = response.data;
                  observer.next(cacheData);

                case 25:
                  _context.next = 30;
                  break;

                case 27:
                  _context.prev = 27;
                  _context.t0 = _context['catch'](4);

                  observer.next([]);

                case 30:
                  _context.prev = 30;

                  if (!_this.isOnline()) {
                    _context.next = 51;
                    break;
                  }

                  useDeltaFetch = options.useDeltaFetch || !!_this.useDeltaFetch;
                  _config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
                    authType: _request8.AuthType.Default,
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
                  });
                  _request = new _network.NetworkRequest(_config);

                  // Should we use delta fetch?

                  if (useDeltaFetch) {
                    _request = new _deltafetch.DeltaFetchRequest(_config);
                  }

                  _context.next = 38;
                  return _request.execute();

                case 38:
                  _response = _context.sent;

                  networkData = _response.data;

                  if (!_this.isCacheEnabled()) {
                    _context.next = 50;
                    break;
                  }

                  // Remove data from the cache that no longer exists on the network and
                  // update the cache with data from the network
                  removedData = (0, _differenceBy2.default)(cacheData, networkData, idAttribute);
                  removedIds = Object.keys((0, _keyBy2.default)(removedData, idAttribute));
                  removeQuery = new _query4.Query().contains(idAttribute, removedIds);
                  _config2 = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
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
                  _request2 = new _cache2.default(_config2);
                  _context.next = 48;
                  return _request2.execute();

                case 48:
                  _context.next = 50;
                  return _this.updateCache(networkData);

                case 50:

                  observer.next(networkData);

                case 51:
                  _context.next = 56;
                  break;

                case 53:
                  _context.prev = 53;
                  _context.t1 = _context['catch'](30);
                  return _context.abrupt('return', observer.error(_context.t1));

                case 56:
                  return _context.abrupt('return', observer.complete());

                case 57:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this, [[4, 27], [30, 53]]);
        }));

        return function (_x2) {
          return ref.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Find a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to find.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(observer) {
          var count, config, request, response, useDeltaFetch, _config3, _request3, _response2, data, _config4, _request4;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (id) {
                    _context2.next = 4;
                    break;
                  }

                  observer.next(null);
                  _context2.next = 52;
                  break;

                case 4:
                  _context2.prev = 4;

                  if (!_this2.isCacheEnabled()) {
                    _context2.next = 24;
                    break;
                  }

                  if (!_this2.isOnline()) {
                    _context2.next = 18;
                    break;
                  }

                  _context2.next = 9;
                  return _this2.syncCount();

                case 9:
                  count = _context2.sent;

                  if (!(count > 0)) {
                    _context2.next = 16;
                    break;
                  }

                  _context2.next = 13;
                  return _this2.push();

                case 13:
                  _context2.next = 15;
                  return _this2.syncCount();

                case 15:
                  count = _context2.sent;

                case 16:
                  if (!(count > 0)) {
                    _context2.next = 18;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data can be loaded.');

                case 18:
                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  request = new _cache2.default(config);
                  _context2.next = 22;
                  return request.execute();

                case 22:
                  response = _context2.sent;

                  observer.next(response.data);

                case 24:
                  _context2.next = 29;
                  break;

                case 26:
                  _context2.prev = 26;
                  _context2.t0 = _context2['catch'](4);

                  observer.next(undefined);

                case 29:
                  _context2.prev = 29;

                  if (!_this2.isOnline()) {
                    _context2.next = 42;
                    break;
                  }

                  useDeltaFetch = options.useDeltaFetch || !!_this2.useDeltaFetch;
                  _config3 = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
                    authType: _request8.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: _this2.client
                  });
                  _request3 = new _network.NetworkRequest(_config3);


                  if (useDeltaFetch) {
                    _request3 = new _deltafetch.DeltaFetchRequest(_config3);
                  }

                  _context2.next = 37;
                  return _request3.execute();

                case 37:
                  _response2 = _context2.sent;
                  data = _response2.data;

                  observer.next(data);
                  _context2.next = 42;
                  return _this2.updateCache(data);

                case 42:
                  _context2.next = 52;
                  break;

                case 44:
                  _context2.prev = 44;
                  _context2.t1 = _context2['catch'](29);

                  if (!(_context2.t1 instanceof _errors.NotFoundError)) {
                    _context2.next = 51;
                    break;
                  }

                  _config4 = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
                    authType: _request8.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  _request4 = new _cache2.default(_config4);
                  _context2.next = 51;
                  return _request4.execute();

                case 51:
                  return _context2.abrupt('return', observer.error(_context2.t1));

                case 52:
                  return _context2.abrupt('return', observer.complete());

                case 53:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this2, [[4, 26], [29, 44]]);
        }));

        return function (_x4) {
          return ref.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Count all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                          Query used to filter entities.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(observer) {
          var count, config, request, response, data, _config5, _request5, _response3, _data;

          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  if (!(query && !(query instanceof _query4.Query))) {
                    _context3.next = 2;
                    break;
                  }

                  return _context3.abrupt('return', observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.')));

                case 2:
                  _context3.prev = 2;

                  if (!_this3.isCacheEnabled()) {
                    _context3.next = 23;
                    break;
                  }

                  if (!_this3.isOnline()) {
                    _context3.next = 16;
                    break;
                  }

                  _context3.next = 7;
                  return _this3.syncCount();

                case 7:
                  count = _context3.sent;

                  if (!(count > 0)) {
                    _context3.next = 14;
                    break;
                  }

                  _context3.next = 11;
                  return _this3.push();

                case 11:
                  _context3.next = 13;
                  return _this3.syncCount();

                case 13:
                  count = _context3.sent;

                case 14:
                  if (!(count > 0)) {
                    _context3.next = 16;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to count data. ' + ('There are ' + count + ' entities that need ') + 'to be synced before data is counted.');

                case 16:
                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
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
                  request = new _cache2.default(config);
                  _context3.next = 20;
                  return request.execute();

                case 20:
                  response = _context3.sent;
                  data = response.data;

                  observer.next(data ? data.count : 0);

                case 23:
                  _context3.next = 28;
                  break;

                case 25:
                  _context3.prev = 25;
                  _context3.t0 = _context3['catch'](2);

                  observer.next(null);

                case 28:
                  _context3.prev = 28;

                  if (!_this3.isOnline()) {
                    _context3.next = 37;
                    break;
                  }

                  _config5 = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.GET,
                    authType: _request8.AuthType.Default,
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
                  _request5 = new _network.NetworkRequest(_config5);
                  _context3.next = 34;
                  return _request5.execute();

                case 34:
                  _response3 = _context3.sent;
                  _data = _response3.data;

                  observer.next(_data ? _data.count : 0);

                case 37:
                  _context3.next = 42;
                  break;

                case 39:
                  _context3.prev = 39;
                  _context3.t1 = _context3['catch'](28);
                  return _context3.abrupt('return', observer.error(_context3.t1));

                case 42:
                  return _context3.abrupt('return', observer.complete());

                case 43:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3, [[2, 25], [28, 39]]);
        }));

        return function (_x6) {
          return ref.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Create a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to create on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'create',
    value: function create(data) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(observer) {
          var singular, config, request, response, ids, query, push, responses;
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (data) {
                    _context4.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context4.next = 34;
                  break;

                case 5:
                  singular = false;


                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  if (!_this4.isCacheEnabled()) {
                    _context4.next = 28;
                    break;
                  }

                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.POST,
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
                  request = new _cache2.default(config);
                  _context4.next = 12;
                  return request.execute();

                case 12:
                  response = _context4.sent;

                  data = response.data;

                  if (!(data.length > 0)) {
                    _context4.next = 25;
                    break;
                  }

                  _context4.next = 17;
                  return _this4.dataStoreSync.addCreateOperation(_this4.collection, data, options);

                case 17:
                  if (!_this4.isOnline()) {
                    _context4.next = 25;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entity._id', ids);
                  _context4.next = 22;
                  return _this4.push(query, options);

                case 22:
                  push = _context4.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 25:

                  observer.next(singular ? data[0] : data);
                  _context4.next = 34;
                  break;

                case 28:
                  if (!_this4.isOnline()) {
                    _context4.next = 34;
                    break;
                  }

                  _context4.next = 31;
                  return Promise.all((0, _map2.default)(data, function (entity) {
                    var config = new _request8.KinveyRequestConfig({
                      method: _request8.RequestMethod.POST,
                      authType: _request8.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this4.client.protocol,
                        host: _this4.client.host,
                        pathname: _this4.pathname,
                        query: options.query
                      }),
                      properties: options.properties,
                      data: entity,
                      timeout: options.timeout,
                      client: _this4.client
                    });
                    var request = new _network.NetworkRequest(config);
                    return request.execute();
                  }));

                case 31:
                  responses = _context4.sent;


                  data = (0, _map2.default)(responses, function (response) {
                    return response.data;
                  });
                  observer.next(singular ? data[0] : data);

                case 34:
                  _context4.next = 39;
                  break;

                case 36:
                  _context4.prev = 36;
                  _context4.t0 = _context4['catch'](0);
                  return _context4.abrupt('return', observer.error(_context4.t0));

                case 39:
                  return _context4.abrupt('return', observer.complete());

                case 40:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this4, [[0, 36]]);
        }));

        return function (_x8) {
          return ref.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Update a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to update on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'update',
    value: function update(data) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(observer) {
          var singular, id, config, request, response, ids, query, push, responses;
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.prev = 0;

                  if (data) {
                    _context5.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context5.next = 35;
                  break;

                case 5:
                  singular = false;
                  id = data[idAttribute];


                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  if (!_this5.isCacheEnabled()) {
                    _context5.next = 29;
                    break;
                  }

                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.PUT,
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
                  request = new _cache2.default(config);
                  _context5.next = 13;
                  return request.execute();

                case 13:
                  response = _context5.sent;

                  data = response.data;

                  if (!(data.length > 0)) {
                    _context5.next = 26;
                    break;
                  }

                  _context5.next = 18;
                  return _this5.dataStoreSync.addUpdateOperation(_this5.collection, data, options);

                case 18:
                  if (!_this5.isOnline()) {
                    _context5.next = 26;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entity._id', ids);
                  _context5.next = 23;
                  return _this5.push(query, options);

                case 23:
                  push = _context5.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 26:

                  observer.next(singular ? data[0] : data);
                  _context5.next = 35;
                  break;

                case 29:
                  if (!_this5.isOnline()) {
                    _context5.next = 35;
                    break;
                  }

                  _context5.next = 32;
                  return Promise.all((0, _map2.default)(data, function (entity) {
                    var id = entity[idAttribute];
                    var config = new _request8.KinveyRequestConfig({
                      method: _request8.RequestMethod.PUT,
                      authType: _request8.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this5.client.protocol,
                        host: _this5.client.host,
                        pathname: id ? _this5.pathname + '/' + id : _this5.pathname,
                        query: options.query
                      }),
                      properties: options.properties,
                      data: entity,
                      timeout: options.timeout,
                      client: _this5.client
                    });
                    var request = new _network.NetworkRequest(config);
                    return request.execute();
                  }));

                case 32:
                  responses = _context5.sent;

                  data = (0, _map2.default)(responses, function (response) {
                    return response.data;
                  });
                  observer.next(singular ? data[0] : data);

                case 35:
                  _context5.next = 40;
                  break;

                case 37:
                  _context5.prev = 37;
                  _context5.t0 = _context5['catch'](0);
                  return _context5.abrupt('return', observer.error(_context5.t0));

                case 40:
                  return _context5.abrupt('return', observer.complete());

                case 41:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this5, [[0, 37]]);
        }));

        return function (_x10) {
          return ref.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Save a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to save on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'save',
    value: function save(data, options) {
      if (data[idAttribute]) {
        return this.update(data, options);
      }

      return this.create(data, options);
    }

    /**
     * Remove all entities in the data store. A query can be optionally provided to remove
     * a subset of all entities in a collection or omitted to remove all entities in
     * a collection. The number of entities removed adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                           Query used to filter entities.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'remove',
    value: function remove(query) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(observer) {
          var config, request, response, data, localData, _query, syncData, ids, _query2, push, _config6, _request6, _response4;

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
                    _context6.next = 31;
                    break;
                  }

                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this6.client.protocol,
                      host: _this6.client.host,
                      pathname: _this6.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache2.default(config);
                  _context6.next = 10;
                  return request.execute();

                case 10:
                  response = _context6.sent;
                  data = response.data;

                  if (!(data.length > 0)) {
                    _context6.next = 28;
                    break;
                  }

                  // Clear local data from the sync table
                  localData = (0, _filter2.default)(data, function (entity) {
                    var metadata = new _metadata.Metadata(entity);
                    return metadata.isLocal();
                  });
                  _query = new _query4.Query().contains('entity._id', Object.keys((0, _keyBy2.default)(localData, idAttribute)));
                  _context6.next = 17;
                  return _this6.dataStoreSync.clear(_query, options);

                case 17:

                  // Create delete operations for non local data in the sync table
                  syncData = (0, _xorWith2.default)(data, localData, function (entity, localEntity) {
                    return entity[idAttribute] === localEntity[idAttribute];
                  });
                  _context6.next = 20;
                  return _this6.dataStoreSync.addDeleteOperation(_this6.collection, syncData, options);

                case 20:
                  if (!_this6.isOnline()) {
                    _context6.next = 28;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(syncData, idAttribute));
                  _query2 = new _query4.Query().contains('entity._id', ids);
                  _context6.next = 25;
                  return _this6.push(_query2, options);

                case 25:
                  push = _context6.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 28:

                  observer.next(data);
                  _context6.next = 38;
                  break;

                case 31:
                  if (!_this6.isOnline()) {
                    _context6.next = 38;
                    break;
                  }

                  _config6 = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
                    authType: _request8.AuthType.Default,
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
                  _request6 = new _network.NetworkRequest(_config6);
                  _context6.next = 36;
                  return _request6.execute();

                case 36:
                  _response4 = _context6.sent;

                  observer.next(_response4.data);

                case 38:
                  _context6.next = 43;
                  break;

                case 40:
                  _context6.prev = 40;
                  _context6.t0 = _context6['catch'](0);
                  return _context6.abrupt('return', observer.error(_context6.t0));

                case 43:
                  return _context6.abrupt('return', observer.complete());

                case 44:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this6, [[0, 40]]);
        }));

        return function (_x12) {
          return ref.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Remove a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to remove.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(observer) {
          var config, request, response, data, metadata, query, _query3, push, _config7, _request7, _response5;

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
                    _context7.next = 33;
                    break;
                  }

                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this7.client.protocol,
                      host: _this7.client.host,
                      pathname: _this7.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    authType: _request8.AuthType.Default,
                    timeout: options.timeout
                  });
                  request = new _cache2.default(config);
                  _context7.next = 10;
                  return request.execute();

                case 10:
                  response = _context7.sent;
                  data = response.data;

                  if (!data) {
                    _context7.next = 30;
                    break;
                  }

                  metadata = new _metadata.Metadata(data);

                  if (!metadata.isLocal()) {
                    _context7.next = 21;
                    break;
                  }

                  query = new _query4.Query();

                  query.equalTo('entity._id', data[idAttribute]);
                  _context7.next = 19;
                  return _this7.dataStoreSync.clear(_this7.collection, query, options);

                case 19:
                  _context7.next = 23;
                  break;

                case 21:
                  _context7.next = 23;
                  return _this7.dataStoreSync.addDeleteOperation(_this7.collection, data, options);

                case 23:
                  if (!_this7.isOnline()) {
                    _context7.next = 30;
                    break;
                  }

                  _query3 = new _query4.Query().equalTo('entity._id', data[idAttribute]);
                  _context7.next = 27;
                  return _this7.push(_query3, options);

                case 27:
                  push = _context7.sent;

                  push = (0, _filter2.default)(push, function (result) {
                    return !result.error;
                  });
                  data = (0, _map2.default)(push, function (result) {
                    return result.entity;
                  });

                case 30:

                  observer.next(data);
                  _context7.next = 34;
                  break;

                case 33:
                  if (_this7.isOnline()) {
                    _config7 = new _request8.KinveyRequestConfig({
                      method: _request8.RequestMethod.DELETE,
                      authType: _request8.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this7.client.protocol,
                        host: _this7.client.host,
                        pathname: _this7.pathname + '/' + id,
                        query: options.query
                      }),
                      properties: options.properties,
                      timeout: options.timeout
                    });
                    _request7 = new _network.NetworkRequest(_config7);
                    _response5 = _request7.execute();

                    observer.next(_response5.data);
                  }

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

      return stream.toPromise();
    }

    /**
     * Remove all entities in the data store that are stored locally.
     *
     * @param   {Query}                 [query]                           Query used to filter entities.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'clear',
    value: function clear(query) {
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(observer) {
          var config, request, response, data, syncQuery, _syncQuery;

          return regeneratorRuntime.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  if (!(query && !(query instanceof _query4.Query))) {
                    _context8.next = 2;
                    break;
                  }

                  return _context8.abrupt('return', observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.')));

                case 2:
                  _context8.prev = 2;

                  if (!_this8.isCacheEnabled()) {
                    _context8.next = 21;
                    break;
                  }

                  config = new _request8.KinveyRequestConfig({
                    method: _request8.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this8.client.protocol,
                      host: _this8.client.host,
                      pathname: _this8.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache2.default(config);
                  _context8.next = 8;
                  return request.execute();

                case 8:
                  response = _context8.sent;
                  data = response.data;

                  if (!(data.length > 0)) {
                    _context8.next = 16;
                    break;
                  }

                  syncQuery = new _query4.Query().contains('entity._id', Object.keys((0, _keyBy2.default)(data, idAttribute)));
                  _context8.next = 14;
                  return _this8.dataStoreSync.clear(syncQuery, options);

                case 14:
                  _context8.next = 20;
                  break;

                case 16:
                  if (query) {
                    _context8.next = 20;
                    break;
                  }

                  _syncQuery = new _query4.Query().equalTo('collection', _this8.collection);
                  _context8.next = 20;
                  return _this8.dataStoreSync.clear(_syncQuery, options);

                case 20:

                  observer.next(data);

                case 21:
                  _context8.next = 26;
                  break;

                case 23:
                  _context8.prev = 23;
                  _context8.t0 = _context8['catch'](2);
                  return _context8.abrupt('return', observer.error(_context8.t0));

                case 26:
                  return _context8.abrupt('return', observer.complete());

                case 27:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8, _this8, [[2, 23]]);
        }));

        return function (_x16) {
          return ref.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Push sync items for the data store to the network. A promise will be returned that will be
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
        var query = arguments.length <= 0 || arguments[0] === undefined ? new _query4.Query() : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (!this.isCacheEnabled()) {
                  _context9.next = 4;
                  break;
                }

                if (!(query instanceof _query4.Query)) {
                  query = new _query4.Query((0, _result2.default)(query, 'toJSON', query));
                }

                query.equalTo('collection', this.collection);
                return _context9.abrupt('return', this.dataStoreSync.push(query, options));

              case 4:
                throw new _errors.KinveyError('Unable to push because the cache is disabled.');

              case 5:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function push(_x17, _x18) {
        return ref.apply(this, arguments);
      }

      return push;
    }()

    /**
     * Pull items for the data store from the network to your local cache. A promise will be
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(query) {
        var _this9 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ret;

        return regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                if (!this.isCacheEnabled()) {
                  _context11.next = 5;
                  break;
                }

                return _context11.delegateYield(regeneratorRuntime.mark(function _callee10() {
                  var count, prevOnlineState;
                  return regeneratorRuntime.wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          _context10.next = 2;
                          return _this9.syncCount(null, options);

                        case 2:
                          count = _context10.sent;

                          if (!(count > 0)) {
                            _context10.next = 5;
                            break;
                          }

                          throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');

                        case 5:
                          prevOnlineState = _this9.isOnline();

                          _this9.online();
                          return _context10.abrupt('return', {
                            v: _this9.find(query, options).toPromise().then(function (data) {
                              if (prevOnlineState === false) {
                                _this9.offline();
                              }

                              return data;
                            }).catch(function (error) {
                              if (prevOnlineState === false) {
                                _this9.offline();
                              }

                              throw error;
                            })
                          });

                        case 8:
                        case 'end':
                          return _context10.stop();
                      }
                    }
                  }, _callee10, _this9);
                })(), 't0', 2);

              case 2:
                _ret = _context11.t0;

                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                  _context11.next = 5;
                  break;
                }

                return _context11.abrupt('return', _ret.v);

              case 5:
                throw new _errors.KinveyError('Unable to pull because the cache is disabled.');

              case 6:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function pull(_x21, _x22) {
        return ref.apply(this, arguments);
      }

      return pull;
    }()

    /**
     * Sync items for the data store. This will push pending sync items first and then
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var push, pull;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                if (!this.isCacheEnabled()) {
                  _context12.next = 8;
                  break;
                }

                _context12.next = 3;
                return this.push(null, options);

              case 3:
                push = _context12.sent;
                _context12.next = 6;
                return this.pull(query, options);

              case 6:
                pull = _context12.sent;
                return _context12.abrupt('return', {
                  push: push,
                  pull: pull
                });

              case 8:
                throw new _errors.KinveyError('Unable to sync because the cache is disabled.');

              case 9:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function sync(_x24, _x25) {
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee13() {
        var query = arguments.length <= 0 || arguments[0] === undefined ? new _query4.Query() : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                if (!this.isCacheEnabled()) {
                  _context13.next = 4;
                  break;
                }

                if (!(query instanceof _query4.Query)) {
                  query = new _query4.Query((0, _result2.default)(query, 'toJSON', query));
                }

                query.equalTo('collection', this.collection);
                return _context13.abrupt('return', this.dataStoreSync.count(query, options));

              case 4:
                throw new _errors.KinveyError('Unable to get the sync count because the cache is disabled.');

              case 5:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function syncCount(_x27, _x28) {
        return ref.apply(this, arguments);
      }

      return syncCount;
    }()

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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var config, request, response;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                if (!this.isCacheEnabled()) {
                  _context14.next = 7;
                  break;
                }

                config = new _request8.KinveyRequestConfig({
                  method: _request8.RequestMethod.PUT,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  data: entities,
                  timeout: options.timeout
                });
                request = new _cache2.default(config);
                _context14.next = 5;
                return request.execute();

              case 5:
                response = _context14.sent;
                return _context14.abrupt('return', response.data);

              case 7:
                throw new _errors.KinveyError('Unable to update the cache because the cache is disabled.');

              case 8:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function updateCache(_x31, _x32) {
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
      var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Cache : arguments[1];

      var store = new DataStore(_collection);

      switch (type) {
        case DataStoreType.Network:
          store.online();
          store.disableCache();
          break;
        case DataStoreType.Sync:
          store.enableCache();
          store.offline();
          break;
        case DataStoreType.Cache:
        default:
          store.online();
          store.enableCache();

      }

      return store;
    }
  }, {
    key: 'getInstance',
    value: function getInstance(collection, type) {
      return DataStore.collection(collection, type);
    }

    /**
     * Deletes the database.
     */

  }, {
    key: 'clear',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee15() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var client, pathname, config, request, response;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                client = options.client || _client2.default.sharedInstance();
                pathname = '/' + appdataNamespace + '/' + client.appKey;
                config = new _request8.KinveyRequestConfig({
                  method: _request8.RequestMethod.DELETE,
                  url: _url2.default.format({
                    protocol: client.protocol,
                    host: client.host,
                    pathname: pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                request = new _cache2.default(config);
                _context15.next = 6;
                return request.execute();

              case 6:
                response = _context15.sent;
                return _context15.abrupt('return', response.data);

              case 8:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function clear(_x35) {
        return ref.apply(this, arguments);
      }

      return clear;
    }()
  }]);

  return DataStore;
}();

exports.DataStore = DataStore;
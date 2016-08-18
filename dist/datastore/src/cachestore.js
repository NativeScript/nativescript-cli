'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _networkstore = require('./networkstore');

var _request = require('../../request');

var _errors = require('../../errors');

var _query4 = require('../../query');

var _sync = require('./sync');

var _entity = require('../../entity');

var _utils = require('../../utils');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _xorWith = require('lodash/xorWith');

var _xorWith2 = _interopRequireDefault(_xorWith);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The CacheStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */

var CacheStore = exports.CacheStore = function (_NetworkStore) {
  _inherits(CacheStore, _NetworkStore);

  function CacheStore(collection) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, CacheStore);

    /**
     * @type {number|undefined}
     */
    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheStore).call(this, collection, options));

    _this.ttl = options.ttl || undefined;

    /**
     * @type {SyncManager}
     */
    _this.syncManager = new _sync.SyncManager(_this.collection, options);
    return _this;
  }

  _createClass(CacheStore, [{
    key: 'find',


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
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(observer) {
          var cacheEntities, request, response, syncCount, networkEntities, removedEntities, removedIds, removeQuery, saveRequest;
          return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  cacheEntities = [];
                  _context.prev = 2;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context.next = 5;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 5:

                  // Fetch the cache entities
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context.next = 8;
                  return request.execute();

                case 8:
                  response = _context.sent;

                  cacheEntities = response.data;

                  // Emit the cache entities
                  observer.next(cacheEntities);
                  _context.next = 15;
                  break;

                case 13:
                  _context.prev = 13;
                  _context.t0 = _context['catch'](2);

                case 15:
                  if (!(_this2.syncAutomatically === true)) {
                    _context.next = 39;
                    break;
                  }

                  _context.next = 18;
                  return _this2.pendingSyncCount(null, options);

                case 18:
                  syncCount = _context.sent;

                  if (!(syncCount > 0)) {
                    _context.next = 25;
                    break;
                  }

                  _context.next = 22;
                  return _this2.push(null, options);

                case 22:
                  _context.next = 24;
                  return _this2.pendingSyncCount(null, options);

                case 24:
                  syncCount = _context.sent;

                case 25:
                  if (!(syncCount > 0)) {
                    _context.next = 27;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 27:
                  _context.next = 29;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'find', _this2).call(_this2, query, options).toPromise();

                case 29:
                  networkEntities = _context.sent;


                  // Remove entities from the cache that no longer exists
                  removedEntities = (0, _differenceBy2.default)(cacheEntities, networkEntities, idAttribute);
                  removedIds = Object.keys((0, _keyBy2.default)(removedEntities, idAttribute));
                  removeQuery = new _query4.Query().contains(idAttribute, removedIds);
                  _context.next = 35;
                  return _this2.clear(removeQuery, options);

                case 35:

                  // Save network entities to cache
                  saveRequest = new _request.CacheRequest({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: networkEntities,
                    timeout: options.timeout
                  });
                  _context.next = 38;
                  return saveRequest.execute();

                case 38:

                  // Emit the network entities
                  observer.next(networkEntities);

                case 39:
                  _context.next = 44;
                  break;

                case 41:
                  _context.prev = 41;
                  _context.t1 = _context['catch'](0);
                  return _context.abrupt('return', observer.error(_context.t1));

                case 44:
                  return _context.abrupt('return', observer.complete());

                case 45:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2, [[0, 41], [2, 13]]);
        }));

        return function (_x3) {
          return _ref.apply(this, arguments);
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
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(observer) {
          var request, response, cacheEntity, syncCount, networkEntity, saveRequest;
          return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;

                  if (id) {
                    _context2.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context2.next = 35;
                  break;

                case 5:
                  _context2.prev = 5;

                  // Fetch from the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this3.client.protocol,
                      host: _this3.client.host,
                      pathname: _this3.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  _context2.next = 9;
                  return request.execute();

                case 9:
                  response = _context2.sent;
                  cacheEntity = response.data;

                  // Emit the cache entity

                  observer.next(cacheEntity);
                  _context2.next = 16;
                  break;

                case 14:
                  _context2.prev = 14;
                  _context2.t0 = _context2['catch'](5);

                case 16:
                  if (!(_this3.syncAutomatically === true)) {
                    _context2.next = 35;
                    break;
                  }

                  _context2.next = 19;
                  return _this3.pendingSyncCount(null, options);

                case 19:
                  syncCount = _context2.sent;

                  if (!(syncCount > 0)) {
                    _context2.next = 26;
                    break;
                  }

                  _context2.next = 23;
                  return _this3.push(null, options);

                case 23:
                  _context2.next = 25;
                  return _this3.pendingSyncCount(null, options);

                case 25:
                  syncCount = _context2.sent;

                case 26:
                  if (!(syncCount > 0)) {
                    _context2.next = 28;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 28:
                  _context2.next = 30;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'findById', _this3).call(_this3, id, options).toPromise();

                case 30:
                  networkEntity = _context2.sent;


                  // Save the network entity to cache
                  saveRequest = new _request.CacheRequest({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this3.client.protocol,
                      host: _this3.client.host,
                      pathname: _this3.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: networkEntity,
                    timeout: options.timeout
                  });
                  _context2.next = 34;
                  return saveRequest.execute();

                case 34:

                  // Emit the network entity
                  observer.next(networkEntity);

                case 35:
                  _context2.next = 40;
                  break;

                case 37:
                  _context2.prev = 37;
                  _context2.t1 = _context2['catch'](0);
                  return _context2.abrupt('return', observer.error(_context2.t1));

                case 40:
                  return _context2.abrupt('return', observer.complete());

                case 41:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this3, [[0, 37], [5, 14]]);
        }));

        return function (_x5) {
          return _ref2.apply(this, arguments);
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
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(observer) {
          var request, response, data, syncCount, networkCount;
          return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context3.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:
                  _context3.prev = 3;

                  // Count the entities in the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this4.client.protocol,
                      host: _this4.client.host,
                      pathname: _this4.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context3.next = 7;
                  return request.execute();

                case 7:
                  response = _context3.sent;
                  data = response.data;

                  // Emit the cache count

                  observer.next(data ? data.count : 0);
                  _context3.next = 14;
                  break;

                case 12:
                  _context3.prev = 12;
                  _context3.t0 = _context3['catch'](3);

                case 14:
                  if (!(_this4.syncAutomatically === true)) {
                    _context3.next = 30;
                    break;
                  }

                  _context3.next = 17;
                  return _this4.pendingSyncCount(null, options);

                case 17:
                  syncCount = _context3.sent;

                  if (!(syncCount > 0)) {
                    _context3.next = 24;
                    break;
                  }

                  _context3.next = 21;
                  return _this4.push(null, options);

                case 21:
                  _context3.next = 23;
                  return _this4.pendingSyncCount(null, options);

                case 23:
                  syncCount = _context3.sent;

                case 24:
                  if (!(syncCount > 0)) {
                    _context3.next = 26;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 26:
                  _context3.next = 28;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'count', _this4).call(_this4, query, options).toPromise();

                case 28:
                  networkCount = _context3.sent;


                  // Emit the network count
                  observer.next(networkCount);

                case 30:
                  _context3.next = 35;
                  break;

                case 32:
                  _context3.prev = 32;
                  _context3.t1 = _context3['catch'](0);
                  return _context3.abrupt('return', observer.error(_context3.t1));

                case 35:
                  return _context3.abrupt('return', observer.complete());

                case 36:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this4, [[0, 32], [3, 12]]);
        }));

        return function (_x7) {
          return _ref3.apply(this, arguments);
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
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(observer) {
          var singular, request, response, ids, query, results, entities;
          return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (data) {
                    _context4.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context4.next = 25;
                  break;

                case 5:
                  singular = false;

                  // Cast the data to an array

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  // Save the data to the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.POST,
                    url: _url2.default.format({
                      protocol: _this5.client.protocol,
                      host: _this5.client.host,
                      pathname: _this5.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context4.next = 10;
                  return request.execute();

                case 10:
                  response = _context4.sent;

                  data = response.data;

                  // Add a create operation to sync
                  _context4.next = 14;
                  return _this5.syncManager.addCreateOperation(data, options);

                case 14:
                  if (!(_this5.syncAutomatically === true)) {
                    _context4.next = 24;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context4.next = 19;
                  return _this5.push(query, options);

                case 19:
                  results = _context4.sent;
                  entities = (0, _map2.default)(results, function (result) {
                    return result.entity;
                  });

                  // Emit the data

                  observer.next(singular ? entities[0] : entities);
                  _context4.next = 25;
                  break;

                case 24:
                  // Emit the data
                  observer.next(singular ? data[0] : data);

                case 25:
                  _context4.next = 30;
                  break;

                case 27:
                  _context4.prev = 27;
                  _context4.t0 = _context4['catch'](0);
                  return _context4.abrupt('return', observer.error(_context4.t0));

                case 30:
                  return _context4.abrupt('return', observer.complete());

                case 31:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this5, [[0, 27]]);
        }));

        return function (_x9) {
          return _ref4.apply(this, arguments);
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
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5(observer) {
          var singular, request, response, ids, query, results, entities;
          return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.prev = 0;

                  if (data) {
                    _context5.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context5.next = 25;
                  break;

                case 5:
                  singular = false;

                  // Cast the data to an array

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  // Save the data to the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this6.client.protocol,
                      host: _this6.client.host,
                      pathname: _this6.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context5.next = 10;
                  return request.execute();

                case 10:
                  response = _context5.sent;

                  data = response.data;

                  // Add an update operation to sync
                  _context5.next = 14;
                  return _this6.syncManager.addUpdateOperation(data, options);

                case 14:
                  if (!(_this6.syncAutomatically === true)) {
                    _context5.next = 24;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context5.next = 19;
                  return _this6.push(query, options);

                case 19:
                  results = _context5.sent;
                  entities = (0, _map2.default)(results, function (result) {
                    return result.entity;
                  });

                  // Emit the data

                  observer.next(singular ? entities[0] : entities);
                  _context5.next = 25;
                  break;

                case 24:
                  // Emit the data
                  observer.next(singular ? data[0] : data);

                case 25:
                  _context5.next = 30;
                  break;

                case 27:
                  _context5.prev = 27;
                  _context5.t0 = _context5['catch'](0);
                  return _context5.abrupt('return', observer.error(_context5.t0));

                case 30:
                  return _context5.abrupt('return', observer.complete());

                case 31:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this6, [[0, 27]]);
        }));

        return function (_x11) {
          return _ref5.apply(this, arguments);
        };
      }());

      return stream.toPromise();
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
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref6 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(observer) {
          var request, response, entities, localEntities, _query, syncEntities, ids, _query2;

          return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context6.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Remove the data from the cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this7.client.protocol,
                      host: _this7.client.host,
                      pathname: _this7.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context6.next = 6;
                  return request.execute();

                case 6:
                  response = _context6.sent;
                  entities = response.data;

                  if (!(entities && entities.length > 0)) {
                    _context6.next = 16;
                    break;
                  }

                  // Clear local entities from the sync table
                  localEntities = (0, _filter2.default)(entities, function (entity) {
                    var metadata = new _entity.Metadata(entity);
                    return metadata.isLocal();
                  });
                  _query = new _query4.Query().contains('entityId', Object.keys((0, _keyBy2.default)(localEntities, idAttribute)));
                  _context6.next = 13;
                  return _this7.clearSync(_query, options);

                case 13:

                  // Create delete operations for non local data in the sync table
                  syncEntities = (0, _xorWith2.default)(entities, localEntities, function (entity, localEntity) {
                    return entity[idAttribute] === localEntity[idAttribute];
                  });
                  _context6.next = 16;
                  return _this7.syncManager.addDeleteOperation(syncEntities, options);

                case 16:
                  if (!(_this7.syncAutomatically === true)) {
                    _context6.next = 21;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(entities, idAttribute));
                  _query2 = new _query4.Query().contains('entityId', ids);
                  _context6.next = 21;
                  return _this7.push(_query2, options);

                case 21:

                  // Emit the data
                  observer.next(entities);
                  _context6.next = 27;
                  break;

                case 24:
                  _context6.prev = 24;
                  _context6.t0 = _context6['catch'](0);
                  return _context6.abrupt('return', observer.error(_context6.t0));

                case 27:
                  return _context6.abrupt('return', observer.complete());

                case 28:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this7, [[0, 24]]);
        }));

        return function (_x13) {
          return _ref6.apply(this, arguments);
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
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7(observer) {
          var request, response, entity, metadata, query, _query3;

          return _regeneratorRuntime2.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.prev = 0;

                  // Remove from cache
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this8.client.protocol,
                      host: _this8.client.host,
                      pathname: _this8.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    authType: _request.AuthType.Default,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context7.next = 4;
                  return request.execute();

                case 4:
                  response = _context7.sent;
                  entity = response.data;

                  if (!entity) {
                    _context7.next = 17;
                    break;
                  }

                  metadata = new _entity.Metadata(entity);

                  // Clear any pending sync items if the entity
                  // was created locally

                  if (!metadata.isLocal()) {
                    _context7.next = 15;
                    break;
                  }

                  query = new _query4.Query();

                  query.equalTo('entityId', entity[idAttribute]);
                  _context7.next = 13;
                  return _this8.clearSync(query, options);

                case 13:
                  _context7.next = 17;
                  break;

                case 15:
                  _context7.next = 17;
                  return _this8.syncManager.addDeleteOperation(entity, options);

                case 17:
                  if (!(_this8.syncAutomatically === true)) {
                    _context7.next = 21;
                    break;
                  }

                  _query3 = new _query4.Query().equalTo('entityId', entity[idAttribute]);
                  _context7.next = 21;
                  return _this8.push(_query3, options);

                case 21:

                  // Emit the data
                  observer.next(entity);
                  _context7.next = 27;
                  break;

                case 24:
                  _context7.prev = 24;
                  _context7.t0 = _context7['catch'](0);
                  return _context7.abrupt('return', observer.error(_context7.t0));

                case 27:
                  return _context7.abrupt('return', observer.complete());

                case 28:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this8, [[0, 24]]);
        }));

        return function (_x15) {
          return _ref7.apply(this, arguments);
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
      var _this9 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _utils.KinveyObservable.create(function () {
        var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(observer) {
          var request, response, data, syncQuery;
          return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context8.next = 5;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 5:
                  // Create the request
                  request = new _request.CacheRequest({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this9.client.protocol,
                      host: _this9.client.host,
                      pathname: _this9.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  // Execute the request

                  _context8.next = 8;
                  return request.execute();

                case 8:
                  response = _context8.sent;
                  data = response.data;

                  // Remove the data from sync

                  if (query) {
                    _context8.next = 15;
                    break;
                  }

                  _context8.next = 13;
                  return _this9.clearSync(null, options);

                case 13:
                  _context8.next = 19;
                  break;

                case 15:
                  if (!(data && data.length > 0)) {
                    _context8.next = 19;
                    break;
                  }

                  syncQuery = new _query4.Query().contains('entityId', Object.keys((0, _keyBy2.default)(data, idAttribute)));
                  _context8.next = 19;
                  return _this9.clearSync(syncQuery, options);

                case 19:

                  observer.next(data);

                case 20:
                  _context8.next = 25;
                  break;

                case 22:
                  _context8.prev = 22;
                  _context8.t0 = _context8['catch'](0);
                  return _context8.abrupt('return', observer.error(_context8.t0));

                case 25:
                  return _context8.abrupt('return', observer.complete());

                case 26:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8, _this9, [[0, 22]]);
        }));

        return function (_x17) {
          return _ref8.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

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
     */

  }, {
    key: 'pendingSyncCount',
    value: function pendingSyncCount(query, options) {
      return this.syncManager.count(query, options);
    }
  }, {
    key: 'syncCount',
    value: function syncCount(query, options) {
      return this.pendingSyncCount(query, options);
    }
  }, {
    key: 'pendingSyncEntities',
    value: function pendingSyncEntities(query, options) {
      return this.syncManager.find(query, options);
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
     */

  }, {
    key: 'push',
    value: function push(query, options) {
      return this.syncManager.push(query, options);
    }

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
     */

  }, {
    key: 'pull',
    value: function pull(query, options) {
      return this.syncManager.pull(query, options);
    }

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
     */

  }, {
    key: 'sync',
    value: function sync(query, options) {
      return this.syncManager.sync(query, options);
    }
  }, {
    key: 'clearSync',
    value: function clearSync(query, options) {
      return this.syncManager.clear(query, options);
    }

    /**
     * @deprecated Use clearSync() instead of this.
     */

  }, {
    key: 'purge',
    value: function purge(query, options) {
      return this.clearSync(query, options);
    }
  }, {
    key: 'syncAutomatically',
    get: function get() {
      return true;
    }
  }]);

  return CacheStore;
}(_networkstore.NetworkStore);
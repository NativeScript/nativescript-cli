'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _sync2 = require('../sync');

var _sync3 = _interopRequireDefault(_sync2);

var _networkstore = require('./networkstore');

var _enums = require('../enums');

var _errors = require('../errors');

var _local = require('../requests/local');

var _deltafetch = require('../requests/deltafetch');

var _query = require('../query');

var _aggregation = require('../aggregation');

var _log = require('../log');

var _metadata = require('../metadata');

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _babybird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _babybird2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = '_id' || '_id';
var syncEnabledSymbol = Symbol();

/**
 * The CacheStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network using a cache on the device.
 */

var CacheStore = exports.CacheStore = function (_NetworkStore) {
  _inherits(CacheStore, _NetworkStore);

  /**
   * Creates a new instance of the CacheStore class.
   *
   * @param   {string}  name   Name of the collection
   *
   * @throws  {KinveyError}   If the name provided is not a string.
   */

  function CacheStore(name) {
    _classCallCheck(this, CacheStore);

    /**
     * @type {Number}
     */

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheStore).call(this, name));

    _this.ttl = undefined;

    /**
     * @type {Sync}
     */
    _this.sync = new _sync3.default();
    _this.sync.client = _this.client;

    // Enable sync
    _this.enableSync();
    return _this;
  }

  _createClass(CacheStore, [{
    key: 'disableSync',
    value: function disableSync() {
      this[syncEnabledSymbol] = false;
    }
  }, {
    key: 'enableSync',
    value: function enableSync() {
      this[syncEnabledSymbol] = true;
    }
  }, {
    key: 'isSyncEnabled',
    value: function isSyncEnabled() {
      return !!this[syncEnabledSymbol];
    }

    /**
     * Finds all entities in a collection. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned will adhere to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
     * promise will be returned that will be resolved with the entities or rejected with
     * an error.
     *
     * @param   {Query}                 [query]                                   Query used to filter result.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data retrieved
     *                                                                            from the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'find',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, cachedEntities, promise;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = (0, _assign2.default)({
                  useDeltaFetch: true
                }, options);

                if (!(query && !(query instanceof _query.Query))) {
                  _context.next = 3;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

              case 3:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                });
                _context.next = 6;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 6:
                cachedEntities = _context.sent;
                promise = this.syncCount().then(function (count) {
                  if (count > 0) {
                    return _this2.push().then(function () {
                      return _this2.syncCount();
                    });
                  }

                  return count;
                }).then(function (count) {
                  if (count > 0) {
                    throw new _errors.KinveyError('Unable to load data from the network. There are ' + count + ' entities that need ' + 'to be synced before data is loaded from the network.');
                  }

                  if (options.useDeltaFetch) {
                    var _request = new _deltafetch.DeltaFetchRequest({
                      method: _enums.HttpMethod.GET,
                      authType: _enums.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this2.client.protocol,
                        host: _this2.client.host,
                        pathname: _this2._pathname
                      }),
                      properties: options.properties,
                      query: query,
                      timeout: options.timeout,
                      client: _this2.client
                    });
                    return _request.execute().then(function (response) {
                      return response.data;
                    });
                  }

                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'find', _this2).call(_this2, query, options);
                }).then(function (networkEntities) {
                  var removedEntities = (0, _differenceBy2.default)(cachedEntities, networkEntities, idAttribute);
                  var removedEntityIds = Object.keys((0, _keyBy2.default)(removedEntities, idAttribute));
                  var removeQuery = new _query.Query();
                  removeQuery.contains(idAttribute, removedEntityIds);
                  var request = new _local.LocalRequest({
                    method: _enums.HttpMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2._pathname
                    }),
                    properties: options.properties,
                    query: removeQuery,
                    timeout: options.timeout,
                    client: _this2.client
                  });
                  return request.execute().then(function () {
                    return _this2._cache(networkEntities);
                  });
                });
                return _context.abrupt('return', {
                  cache: cachedEntities,
                  networkPromise: promise
                });

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x, _x2) {
        return ref.apply(this, arguments);
      }

      return find;
    }()

    /**
     * Groups entities in a collection. An aggregation can be optionally provided to group
     * a subset of entities in a collection or omitted to group all the entities
     * in a collection. A promise will be returned that will be resolved with the result
     * or rejected with an error.
     *
     * @param   {Aggregation}           aggregation                               Aggregation used to group entities.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data retrieved
     *                                                                            from the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'group',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(aggregation) {
        var _this3 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, cachedResult, promise;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (aggregation instanceof _aggregation.Aggregation) {
                  _context2.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/_group'
                  }),
                  properties: options.properties,
                  data: aggregation.toJSON(),
                  timeout: options.timeout,
                  client: this.client
                });
                _context2.next = 5;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 5:
                cachedResult = _context2.sent;
                promise = this.syncCount().then(function (count) {
                  if (count > 0) {
                    return _this3.push().then(function () {
                      return _this3.syncCount();
                    });
                  }

                  return count;
                }).then(function (count) {
                  if (count > 0) {
                    throw new _errors.KinveyError('Unable to load data from the network. There are ' + count + ' entities that need ' + 'to be synced before data is loaded from the network.');
                  }

                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'group', _this3).call(_this3, aggregation, options);
                });
                return _context2.abrupt('return', {
                  cache: cachedResult,
                  networkPromise: promise
                });

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function group(_x4, _x5) {
        return ref.apply(this, arguments);
      }

      return group;
    }()

    /**
     * Counts entities in a collection. A query can be optionally provided to count
     * a subset of entities in a collection or omitted to count all the entities
     * in a collection. A promise will be returned that will be resolved with the count
     * or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to count a subset of entities.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data retrieved
     *                                                                            from the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'count',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(query) {
        var _this4 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, cachedCount, promise;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context3.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/_count'
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                });
                _context3.next = 5;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 5:
                cachedCount = _context3.sent;
                promise = this.syncCount().then(function (count) {
                  if (count > 0) {
                    return _this4.push().then(function () {
                      return _this4.syncCount();
                    });
                  }

                  return count;
                }).then(function (count) {
                  if (count > 0) {
                    throw new _errors.KinveyError('Unable to load data from the network. There are ' + count + ' entities that need ' + 'to be synced before data is loaded from the network.');
                  }

                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'count', _this4).call(_this4, query, options);
                });
                return _context3.abrupt('return', {
                  cache: cachedCount,
                  networkPromise: promise
                });

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function count(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return count;
    }()

    /**
     * Retrieves a single entity in a collection by id. A promise will be returned that will
     * be resolved with the entity or rejected with an error.
     *
     * @param   {string}                id                                        Document Id
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data retrieved
     *                                                                            from the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'findById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(id) {
        var _this5 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, cachedEntity, promise;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = (0, _assign2.default)({
                  useDeltaFetch: true
                }, options);

                if (id) {
                  _context4.next = 4;
                  break;
                }

                _log.Log.warn('No id was provided to retrieve an entity.', id);
                return _context4.abrupt('return', null);

              case 4:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                cachedEntity = null;
                _context4.prev = 6;
                _context4.next = 9;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 9:
                cachedEntity = _context4.sent;
                _context4.next = 17;
                break;

              case 12:
                _context4.prev = 12;
                _context4.t0 = _context4['catch'](6);

                if (_context4.t0 instanceof _errors.NotFoundError) {
                  _context4.next = 16;
                  break;
                }

                throw _context4.t0;

              case 16:

                cachedEntity = null;

              case 17:
                promise = this.syncCount().then(function (count) {
                  if (count > 0) {
                    return _this5.push().then(function () {
                      return _this5.syncCount();
                    });
                  }

                  return count;
                }).then(function (count) {
                  if (count > 0) {
                    throw new _errors.KinveyError('Unable to load data from the network. There are ' + count + ' entities that need ' + 'to be synced before data is loaded from the network.');
                  }

                  if (options.useDeltaFetch) {
                    var _request2 = new _deltafetch.DeltaFetchRequest({
                      method: _enums.HttpMethod.GET,
                      authType: _enums.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this5.client.protocol,
                        host: _this5.client.host,
                        pathname: _this5._pathname + '/' + id
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      client: _this5.client
                    });
                    return _request2.execute().then(function (response) {
                      return response.data;
                    });
                  }

                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'findById', _this5).call(_this5, id, options);
                }).then(function (data) {
                  return _this5._cache(data);
                }).catch(function (error) {
                  if (error instanceof _errors.NotFoundError) {
                    var _request3 = new _local.LocalRequest({
                      method: _enums.HttpMethod.DELETE,
                      authType: _enums.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this5.client.protocol,
                        host: _this5.client.host,
                        pathname: _this5._pathname + '/' + id
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      client: _this5.client
                    });
                    return _request3.execute().then(function () {
                      throw error;
                    });
                  }

                  throw error;
                });
                return _context4.abrupt('return', {
                  cache: cachedEntity,
                  networkPromise: promise
                });

              case 19:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[6, 12]]);
      }));

      function findById(_x10, _x11) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()

    /**
     * Save a entity or an array of entities to a collection. A promise will be returned that
     * will be resolved with the saved entity/entities or rejected with an error.
     *
     * @param   {Object|Array}          entities                                  Entity or entities to save.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data saved
     *                                                                            in the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(entities) {
        var _this6 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var singular, request, ids, query, push;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                singular = false;

                if (entities) {
                  _context5.next = 4;
                  break;
                }

                _log.Log.warn('No entity was provided to be saved.', entities);
                return _context5.abrupt('return', _babybird2.default.resolve(null));

              case 4:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.POST,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname
                  }),
                  properties: options.properties,
                  body: entities,
                  timeout: options.timeout
                });


                if (entities[idAttribute]) {
                  request.method = _enums.HttpMethod.PUT;
                  request.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/' + entities[idAttribute]
                  });
                }

                _context5.next = 8;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 8:
                entities = _context5.sent;


                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                _context5.next = 12;
                return _babybird2.default.all((0, _map2.default)(entities, function (entity) {
                  return _this6.sync.save(_this6.name, entity, options);
                }));

              case 12:
                ids = Object.keys((0, _keyBy2.default)(entities, idAttribute));
                query = new _query.Query().contains(idAttribute, ids);
                _context5.next = 16;
                return this.push(query, options);

              case 16:
                push = _context5.sent;

                push = (0, _filter2.default)(push, function (result) {
                  return !result.error;
                });
                entities = (0, _map2.default)(push, function (result) {
                  return result.entity;
                });
                return _context5.abrupt('return', singular ? entities[0] : entities);

              case 20:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function save(_x13, _x14) {
        return ref.apply(this, arguments);
      }

      return save;
    }()

    /**
     * Remove entities in a collection. A query can be optionally provided to remove
     * a subset of entities in a collection or omitted to remove all entities in a
     * collection. A promise will be returned that will be resolved with a count of the
     * number of entities removed or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'remove',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, result, entities, pushQuery;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt('return', _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.')));

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.DELETE,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                });
                _context6.next = 5;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 5:
                result = _context6.sent;
                entities = (0, _filter2.default)(result.entities, function (entity) {
                  var metadata = new _metadata.Metadata(entity);
                  return !metadata.isLocal();
                });
                _context6.next = 9;
                return this._sync(entities, options);

              case 9:
                pushQuery = new _query.Query().contains(idAttribute, Object.keys((0, _keyBy2.default)(entities, idAttribute)));
                _context6.next = 12;
                return this.push(pushQuery, options);

              case 12:
                return _context6.abrupt('return', result);

              case 13:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function remove(_x16, _x17) {
        return ref.apply(this, arguments);
      }

      return remove;
    }()

    /**
     * Remove an entity in a collection. A promise will be returned that will be
     * resolved with a count of the number of entities removed or rejected with an error.
     *
     * @param   {string}                id                                        Document Id
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'removeById',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, result, entities, query;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (id) {
                  _context7.next = 3;
                  break;
                }

                _log.Log.warn('No id was provided to be removed.');
                return _context7.abrupt('return', _babybird2.default.resolve(null));

              case 3:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.DELETE,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/' + id
                  }),
                  properties: options.properties,
                  authType: _enums.AuthType.Default,
                  timeout: options.timeout,
                  client: this.client
                });
                _context7.next = 6;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 6:
                result = _context7.sent;
                entities = (0, _filter2.default)(result.entities, function (entity) {
                  var metadata = new _metadata.Metadata(entity);
                  return !metadata.isLocal();
                });
                _context7.next = 10;
                return this._sync(entities, options);

              case 10:
                query = new _query.Query().contains(idAttribute, Object.keys((0, _keyBy2.default)(entities, idAttribute)));
                _context7.next = 13;
                return this.push(query, options);

              case 13:
                return _context7.abrupt('return', result);

              case 14:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function removeById(_x19, _x20) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()

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
    value: function push(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!this.isSyncEnabled()) {
        return _babybird2.default.reject(new _errors.KinveyError('Sync is disabled.'));
      }

      return this.sync.execute(this.name, query, options);
    }

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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var count;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.syncCount(null, options);

              case 2:
                count = _context8.sent;

                if (!(count > 0)) {
                  _context8.next = 5;
                  break;
                }

                throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');

              case 5:
                return _context8.abrupt('return', this.find(query, options).then(function (result) {
                  return result.networkPromise;
                }));

              case 6:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function pull(_x23, _x24) {
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var push, pull;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.push(null, options);

              case 2:
                push = _context9.sent;
                _context9.next = 5;
                return this.pull(query, options);

              case 5:
                pull = _context9.sent;
                return _context9.abrupt('return', {
                  push: push,
                  pull: pull
                });

              case 7:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function sync(_x26, _x27) {
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

      if (!(query instanceof _query.Query)) {
        query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
      }

      query.equalTo('collection', this.name);
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
    key: '_cache',
    value: function _cache(entities) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return new _local.LocalRequest({
        method: _enums.HttpMethod.PUT,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname
        }),
        properties: options.properties,
        data: entities,
        timeout: options.timeout,
        client: this.client
      }).execute().then(function (response) {
        return response.data;
      });
    }

    /**
     * Add entities to be pushed. A promise will be returned with null or rejected with an error.
     *
     * @param   {Object|Array}          entities                                  Entity(s) to add to the sync table.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: '_sync',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                if (this.isSyncEnabled()) {
                  _context10.next = 2;
                  break;
                }

                return _context10.abrupt('return', null);

              case 2:
                return _context10.abrupt('return', this.sync.notify(this.name, entities, options));

              case 3:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _sync(_x31, _x32) {
        return ref.apply(this, arguments);
      }

      return _sync;
    }()
  }, {
    key: 'client',
    get: function get() {
      return _get(Object.getPrototypeOf(CacheStore.prototype), 'client', this);
    },
    set: function set(client) {
      _set(Object.getPrototypeOf(CacheStore.prototype), 'client', client, this);
      this.sync.client = client;
    }
  }]);

  return CacheStore;
}(_networkstore.NetworkStore);
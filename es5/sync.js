'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request2 = require('./requests/request');

var _errors = require('./errors');

var _metadata = require('./metadata');

var _cache = require('./requests/cache');

var _cache2 = _interopRequireDefault(_cache);

var _network = require('./requests/network');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _storage = require('./utils/storage');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _orderBy = require('lodash/orderBy');

var _orderBy2 = _interopRequireDefault(_orderBy);

var _sortedUniqBy = require('lodash/sortedUniqBy');

var _sortedUniqBy2 = _interopRequireDefault(_sortedUniqBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey_sync';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

var Sync = function () {
  function Sync() {
    _classCallCheck(this, Sync);

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();
  }

  /**
   * Pathname used to send sync requests.
   *
   * @return {String} sync pathname
   */


  _createClass(Sync, [{
    key: 'count',


    /**
     * Count the number of entities that are waiting to be synced. A query can be
     * provided to only count a subset of entities.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var sync = new Sync();
     * var promise = sync.count().then(function(count) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var syncEntities, request;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                syncEntities = [];

                // Get all sync entities

                request = new _cache2.default({
                  method: _request2.RequestMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                });
                _context.next = 4;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 4:
                syncEntities = _context.sent;


                // Filter the sync entities so that we only perform
                // one sync operation per unique entity.
                syncEntities = (0, _orderBy2.default)(syncEntities, 'key', ['desc']);
                syncEntities = (0, _sortedUniqBy2.default)(syncEntities, function (syncEntity) {
                  return syncEntity.entity[idAttribute];
                });

                // Return the length of sync entities
                return _context.abrupt('return', syncEntities.length);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function count(_x, _x2) {
        return ref.apply(this, arguments);
      }

      return count;
    }()

    /**
     * Save a sync entity to the sync table with a POST method.
     *
     * @param   {String}        collection                  Collection name for the entity.
     * @param   {Object|Array}  entity                      Entity to add to the sync table.
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var entity = {
     *   _id: '1',
     *   prop: 'value'
     * };
     * var sync = new Sync();
     * var promise = sync.save('collectionName', entities).then(function(entity) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'addCreateOperation',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(collection, entities) {
        var _this = this;

        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var singular;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                singular = false;

                // Check that a name was provided

                if (collection) {
                  _context3.next = 3;
                  break;
                }

                throw new _errors.SyncError('A name for a collection must be provided to add entities to the sync table.');

              case 3:

                // Cast the entities to an array
                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                // Process the array of entities
                _context3.next = 6;
                return Promise.all((0, _map2.default)(entities, function () {
                  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(entity) {
                    var id, key, syncEntity, request;
                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            if (entity) {
                              _context2.next = 2;
                              break;
                            }

                            return _context2.abrupt('return', null);

                          case 2:

                            // Validate that the entity has an id
                            id = entity[idAttribute];

                            if (id) {
                              _context2.next = 5;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 5:

                            // Get the sync key, increment it by 1 and save
                            key = (0, _storage.getSyncKey)(_this.client) || 0;

                            key += 1;
                            (0, _storage.setSyncKey)(_this.client, key);

                            // Create the sync entity
                            syncEntity = {
                              key: key,
                              collection: collection,
                              state: {
                                method: _request2.RequestMethod.POST
                              },
                              entity: entity
                            };

                            // Validate that the entity has an id

                            if (id) {
                              _context2.next = 11;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 11:

                            // Send a request to save the sync entity
                            request = new _cache2.default({
                              method: _request2.RequestMethod.POST,
                              url: _url2.default.format({
                                protocol: _this.client.protocol,
                                host: _this.client.host,
                                pathname: _this.pathname
                              }),
                              properties: options.properties,
                              body: syncEntity,
                              timeout: options.timeout
                            });
                            return _context2.abrupt('return', request.execute());

                          case 13:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this);
                  }));

                  return function (_x8) {
                    return ref.apply(this, arguments);
                  };
                }()));

              case 6:
                return _context3.abrupt('return', singular ? entities[0] : entities);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function addCreateOperation(_x4, _x5, _x6) {
        return ref.apply(this, arguments);
      }

      return addCreateOperation;
    }()
  }, {
    key: 'addUpdateOperation',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(collection, entities) {
        var _this2 = this;

        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var singular;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                singular = false;

                // Check that a name was provided

                if (collection) {
                  _context5.next = 3;
                  break;
                }

                throw new _errors.SyncError('A name for a collection must be provided to add entities to the sync table.');

              case 3:

                // Cast the entities to an array
                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                // Process the array of entities
                _context5.next = 6;
                return Promise.all((0, _map2.default)(entities, function () {
                  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(entity) {
                    var id, key, syncEntity, request;
                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            if (entity) {
                              _context4.next = 2;
                              break;
                            }

                            return _context4.abrupt('return', null);

                          case 2:

                            // Validate that the entity has an id
                            id = entity[idAttribute];

                            if (id) {
                              _context4.next = 5;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 5:

                            // Get the sync key, increment it by 1 and save
                            key = (0, _storage.getSyncKey)(_this2.client) || 0;

                            key += 1;
                            (0, _storage.setSyncKey)(_this2.client, key);

                            // Create the sync entity
                            syncEntity = {
                              key: key,
                              collection: collection,
                              state: {
                                method: _request2.RequestMethod.PUT
                              },
                              entity: entity
                            };

                            // Validate that the entity has an id

                            if (id) {
                              _context4.next = 11;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 11:

                            // Send a request to save the sync entity
                            request = new _cache2.default({
                              method: _request2.RequestMethod.POST,
                              url: _url2.default.format({
                                protocol: _this2.client.protocol,
                                host: _this2.client.host,
                                pathname: _this2.pathname
                              }),
                              properties: options.properties,
                              body: syncEntity,
                              timeout: options.timeout
                            });
                            return _context4.abrupt('return', request.execute());

                          case 13:
                          case 'end':
                            return _context4.stop();
                        }
                      }
                    }, _callee4, _this2);
                  }));

                  return function (_x13) {
                    return ref.apply(this, arguments);
                  };
                }()));

              case 6:
                return _context5.abrupt('return', singular ? entities[0] : entities);

              case 7:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function addUpdateOperation(_x9, _x10, _x11) {
        return ref.apply(this, arguments);
      }

      return addUpdateOperation;
    }()

    /**
     * Save a sync entity to the sync table with a DELETE method.
     *
     * @param   {String}        collection                  Collection name for the entity.
     * @param   {Object|Array}  entity                      Entity to add to the sync table.
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var entity = {
     *   _id: '1',
     *   prop: 'value'
     * };
     * var sync = new Sync();
     * var promise = sync.remove('collectionName', entities).then(function(entity) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'addDeleteOperation',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(collection, entities) {
        var _this3 = this;

        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var singular;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                singular = false;

                // Check that a name was provided

                if (collection) {
                  _context7.next = 3;
                  break;
                }

                throw new _errors.SyncError('A name for a collection must be provided to add entities to the sync table.');

              case 3:

                // Cast the entities to an array
                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                // Process the array of entities
                _context7.next = 6;
                return Promise.all((0, _map2.default)(entities, function () {
                  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(entity) {
                    var id, key, syncEntity, request;
                    return regeneratorRuntime.wrap(function _callee6$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            if (entity) {
                              _context6.next = 2;
                              break;
                            }

                            return _context6.abrupt('return', null);

                          case 2:

                            // Validate that the entity has an id
                            id = entity[idAttribute];

                            if (id) {
                              _context6.next = 5;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 5:

                            // Get the sync key, increment it by 1 and save
                            key = (0, _storage.getSyncKey)(_this3.client) || 0;

                            key += 1;
                            (0, _storage.setSyncKey)(_this3.client, key);

                            // Create the sync entity
                            syncEntity = {
                              key: key,
                              collection: collection,
                              state: {
                                method: _request2.RequestMethod.DELETE
                              },
                              entity: entity
                            };

                            // Validate that the entity has an id

                            if (id) {
                              _context6.next = 11;
                              break;
                            }

                            throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);

                          case 11:

                            // Send a request to save the sync entity
                            request = new _cache2.default({
                              method: _request2.RequestMethod.POST,
                              url: _url2.default.format({
                                protocol: _this3.client.protocol,
                                host: _this3.client.host,
                                pathname: _this3.pathname
                              }),
                              properties: options.properties,
                              body: syncEntity,
                              timeout: options.timeout
                            });
                            return _context6.abrupt('return', request.execute());

                          case 13:
                          case 'end':
                            return _context6.stop();
                        }
                      }
                    }, _callee6, _this3);
                  }));

                  return function (_x18) {
                    return ref.apply(this, arguments);
                  };
                }()));

              case 6:
                return _context7.abrupt('return', singular ? entities[0] : entities);

              case 7:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function addDeleteOperation(_x14, _x15, _x16) {
        return ref.apply(this, arguments);
      }

      return addDeleteOperation;
    }()

    /**
     * Sync entities with the network. A query can be provided to
     * sync a subset of entities.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var sync = new Sync();
     * var promise = sync.push().then(function(response) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'push',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(query) {
        var _this4 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var syncResults, failedSyncEntities, batchSize, i, deleteRequest, response, syncEntities;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                syncResults = [];
                failedSyncEntities = [];
                batchSize = 100;
                i = 0;

                // Make a request for the pending sync entities

                deleteRequest = new _cache2.default({
                  method: _request2.RequestMethod.DELETE,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout
                });
                _context14.next = 7;
                return deleteRequest.execute();

              case 7:
                response = _context14.sent;
                syncEntities = response.data;

                if (!(syncEntities.length > 0)) {
                  _context14.next = 11;
                  break;
                }

                return _context14.delegateYield(regeneratorRuntime.mark(function _callee13() {
                  var batchSync, putRequest;
                  return regeneratorRuntime.wrap(function _callee13$(_context13) {
                    while (1) {
                      switch (_context13.prev = _context13.next) {
                        case 0:
                          // Filter the sync entities so that we only perform
                          // one sync operation per unique entity.
                          syncEntities = (0, _orderBy2.default)(syncEntities, 'key', ['desc']);
                          syncEntities = (0, _sortedUniqBy2.default)(syncEntities, function (syncEntity) {
                            return syncEntity.entity[idAttribute];
                          });

                          // Sync the entities in batches to prevent exhausting
                          // available network connections

                          batchSync = function () {
                            var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(syncResults) {
                              var promise;
                              return regeneratorRuntime.wrap(function _callee12$(_context12) {
                                while (1) {
                                  switch (_context12.prev = _context12.next) {
                                    case 0:
                                      promise = new Promise(function () {
                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(resolve) {
                                          var batch, results;
                                          return regeneratorRuntime.wrap(function _callee11$(_context11) {
                                            while (1) {
                                              switch (_context11.prev = _context11.next) {
                                                case 0:
                                                  batch = syncEntities.slice(i, i + batchSize);

                                                  i += batchSize;

                                                  // Get the results of syncing all of the entities
                                                  _context11.next = 4;
                                                  return Promise.all((0, _map2.default)(batch, function (syncEntity) {
                                                    var collection = syncEntity.collection;
                                                    var entity = syncEntity.entity;
                                                    var metadata = new _metadata.Metadata(entity);
                                                    var originalId = entity[idAttribute];
                                                    var method = syncEntity.state.method;

                                                    if (method === _request2.RequestMethod.DELETE) {
                                                      // Remove the entity from the network.
                                                      var request = new _network.NetworkRequest({
                                                        method: _request2.RequestMethod.DELETE,
                                                        authType: _request2.AuthType.Default,
                                                        url: _url2.default.format({
                                                          protocol: _this4.client.protocol,
                                                          host: _this4.client.host,
                                                          pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                        }),
                                                        properties: options.properties,
                                                        timeout: options.timeout,
                                                        client: _this4.client
                                                      });
                                                      return request.execute().then(function () {
                                                        var result = { _id: originalId, entity: entity };
                                                        return result;
                                                      }).catch(function () {
                                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(error) {
                                                          var getNetworkRequest, originalEntity, putCacheRequest;
                                                          return regeneratorRuntime.wrap(function _callee8$(_context8) {
                                                            while (1) {
                                                              switch (_context8.prev = _context8.next) {
                                                                case 0:
                                                                  if (!(error instanceof _errors.NotFoundError) || !(error instanceof _errors.InsufficientCredentialsError)) {
                                                                    failedSyncEntities.push(syncEntity);
                                                                  }

                                                                  // If the credentials used to authenticate this request are
                                                                  // not authorized to run the operation

                                                                  if (!(error instanceof _errors.InsufficientCredentialsError)) {
                                                                    _context8.next = 14;
                                                                    break;
                                                                  }

                                                                  _context8.prev = 2;

                                                                  // Try and reset the state of the entity
                                                                  getNetworkRequest = new _network.NetworkRequest({
                                                                    method: _request2.RequestMethod.GET,
                                                                    authType: _request2.AuthType.Default,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    client: _this4.client
                                                                  });
                                                                  _context8.next = 6;
                                                                  return getNetworkRequest.execute().then(function (response) {
                                                                    return response.data;
                                                                  });

                                                                case 6:
                                                                  originalEntity = _context8.sent;
                                                                  putCacheRequest = new _cache2.default({
                                                                    method: _request2.RequestMethod.PUT,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    body: originalEntity
                                                                  });
                                                                  _context8.next = 10;
                                                                  return putCacheRequest.execute();

                                                                case 10:
                                                                  _context8.next = 14;
                                                                  break;

                                                                case 12:
                                                                  _context8.prev = 12;
                                                                  _context8.t0 = _context8['catch'](2);

                                                                case 14:
                                                                  return _context8.abrupt('return', {
                                                                    _id: originalId,
                                                                    entity: entity,
                                                                    error: error
                                                                  });

                                                                case 15:
                                                                case 'end':
                                                                  return _context8.stop();
                                                              }
                                                            }
                                                          }, _callee8, _this4, [[2, 12]]);
                                                        }));

                                                        return function (_x24) {
                                                          return ref.apply(this, arguments);
                                                        };
                                                      }());
                                                    } else if (method === _request2.RequestMethod.POST || method === _request2.RequestMethod.PUT) {
                                                      // Save the entity to the network.
                                                      var _request = new _network.NetworkRequest({
                                                        method: method,
                                                        authType: _request2.AuthType.Default,
                                                        url: _url2.default.format({
                                                          protocol: _this4.client.protocol,
                                                          host: _this4.client.host,
                                                          pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                        }),
                                                        properties: options.properties,
                                                        timeout: options.timeout,
                                                        body: entity,
                                                        client: _this4.client
                                                      });

                                                      // If the entity was created locally then delete the autogenerated _id,
                                                      // send a POST request, and update the url.
                                                      if (metadata.isLocal()) {
                                                        delete entity[idAttribute];
                                                        delete entity[kmdAttribute].local;
                                                        _request.method = _request2.RequestMethod.POST;
                                                        _request.url = _url2.default.format({
                                                          protocol: _this4.client.protocol,
                                                          host: _this4.client.host,
                                                          pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection
                                                        });
                                                        _request.body = entity;
                                                      }

                                                      return _request.execute().then(function (response) {
                                                        return response.data;
                                                      }).then(function () {
                                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(entity) {
                                                          var putCacheRequest, deleteCacheRequest;
                                                          return regeneratorRuntime.wrap(function _callee9$(_context9) {
                                                            while (1) {
                                                              switch (_context9.prev = _context9.next) {
                                                                case 0:
                                                                  // Save the result of the network request locally.
                                                                  putCacheRequest = new _cache2.default({
                                                                    method: _request2.RequestMethod.PUT,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + entity[idAttribute]
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    body: entity
                                                                  });
                                                                  _context9.next = 3;
                                                                  return putCacheRequest.execute().then(function (response) {
                                                                    return response.data;
                                                                  });

                                                                case 3:
                                                                  entity = _context9.sent;

                                                                  if (!metadata.isLocal()) {
                                                                    _context9.next = 8;
                                                                    break;
                                                                  }

                                                                  deleteCacheRequest = new _cache2.default({
                                                                    method: _request2.RequestMethod.DELETE,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout
                                                                  });
                                                                  _context9.next = 8;
                                                                  return deleteCacheRequest.execute();

                                                                case 8:
                                                                  return _context9.abrupt('return', {
                                                                    _id: originalId,
                                                                    entity: entity
                                                                  });

                                                                case 9:
                                                                case 'end':
                                                                  return _context9.stop();
                                                              }
                                                            }
                                                          }, _callee9, _this4);
                                                        }));

                                                        return function (_x25) {
                                                          return ref.apply(this, arguments);
                                                        };
                                                      }()).catch(function () {
                                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(error) {
                                                          var getNetworkRequest, originalEntity, putCacheRequest;
                                                          return regeneratorRuntime.wrap(function _callee10$(_context10) {
                                                            while (1) {
                                                              switch (_context10.prev = _context10.next) {
                                                                case 0:
                                                                  if (!(error instanceof _errors.InsufficientCredentialsError)) {
                                                                    failedSyncEntities.push(syncEntity);
                                                                  }

                                                                  // If the credentials used to authenticate this request are
                                                                  // not authorized to run the operation then just remove the entity
                                                                  // from the sync table

                                                                  if (!(error instanceof _errors.InsufficientCredentialsError)) {
                                                                    _context10.next = 15;
                                                                    break;
                                                                  }

                                                                  _context10.prev = 2;

                                                                  if (metadata.isLocal()) {
                                                                    _context10.next = 11;
                                                                    break;
                                                                  }

                                                                  getNetworkRequest = new _network.NetworkRequest({
                                                                    method: _request2.RequestMethod.GET,
                                                                    authType: _request2.AuthType.Default,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    client: _this4.client
                                                                  });
                                                                  _context10.next = 7;
                                                                  return getNetworkRequest.execute().then(function (response) {
                                                                    return response.data;
                                                                  });

                                                                case 7:
                                                                  originalEntity = _context10.sent;
                                                                  putCacheRequest = new _cache2.default({
                                                                    method: _request2.RequestMethod.PUT,
                                                                    url: _url2.default.format({
                                                                      protocol: _this4.client.protocol,
                                                                      host: _this4.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this4.client.appKey + '/' + collection + '/' + originalId
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    body: originalEntity
                                                                  });
                                                                  _context10.next = 11;
                                                                  return putCacheRequest.execute();

                                                                case 11:
                                                                  _context10.next = 15;
                                                                  break;

                                                                case 13:
                                                                  _context10.prev = 13;
                                                                  _context10.t0 = _context10['catch'](2);

                                                                case 15:
                                                                  return _context10.abrupt('return', {
                                                                    _id: originalId,
                                                                    entity: entity,
                                                                    error: error
                                                                  });

                                                                case 16:
                                                                case 'end':
                                                                  return _context10.stop();
                                                              }
                                                            }
                                                          }, _callee10, _this4, [[2, 13]]);
                                                        }));

                                                        return function (_x26) {
                                                          return ref.apply(this, arguments);
                                                        };
                                                      }());
                                                    }

                                                    return {
                                                      _id: originalId,
                                                      entity: entity,
                                                      error: new _errors.SyncError('Unable to sync the entity since the method was not recognized.', syncEntity)
                                                    };
                                                  }));

                                                case 4:
                                                  results = _context11.sent;


                                                  // Concat the results
                                                  syncResults = syncResults.concat(results);

                                                  // Sync the remaining entities

                                                  if (!(i < syncEntities.length)) {
                                                    _context11.next = 8;
                                                    break;
                                                  }

                                                  return _context11.abrupt('return', resolve(batchSync(syncResults)));

                                                case 8:
                                                  return _context11.abrupt('return', resolve(syncResults));

                                                case 9:
                                                case 'end':
                                                  return _context11.stop();
                                              }
                                            }
                                          }, _callee11, _this4);
                                        }));

                                        return function (_x23) {
                                          return ref.apply(this, arguments);
                                        };
                                      }());
                                      return _context12.abrupt('return', promise);

                                    case 2:
                                    case 'end':
                                      return _context12.stop();
                                  }
                                }
                              }, _callee12, _this4);
                            }));

                            return function batchSync(_x22) {
                              return ref.apply(this, arguments);
                            };
                          }();

                          // Get the result of sync.


                          _context13.next = 5;
                          return batchSync([]);

                        case 5:
                          syncResults = _context13.sent;

                          if (!(failedSyncEntities.length > 0)) {
                            _context13.next = 10;
                            break;
                          }

                          putRequest = new _cache2.default({
                            method: _request2.RequestMethod.PUT,
                            url: _url2.default.format({
                              protocol: _this4.client.protocol,
                              host: _this4.client.host,
                              pathname: _this4.pathname
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            data: failedSyncEntities
                          });
                          _context13.next = 10;
                          return putRequest.execute();

                        case 10:
                        case 'end':
                          return _context13.stop();
                      }
                    }
                  }, _callee13, _this4);
                })(), 't0', 11);

              case 11:
                return _context14.abrupt('return', syncResults);

              case 12:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function push(_x19, _x20) {
        return ref.apply(this, arguments);
      }

      return push;
    }()

    /**
     * Clear the sync table. A query can be provided to
     * only clear a subet of the sync table.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var sync = new Sync();
     * var promise = sync.clear().then(function(response) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'clear',
    value: function clear(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var request = new _cache2.default({
        method: _request2.RequestMethod.DELETE,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + syncCollectionName;
    }
  }]);

  return Sync;
}();

exports.default = Sync;
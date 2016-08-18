'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncManager = exports.SyncOperation = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _request2 = require('../../request');

var _errors = require('../../errors');

var _client = require('../../client');

var _query = require('../../query');

var _es6Promise = require('es6-promise');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey_sync';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * @private
 * Enum for Sync Operations.
 */
var SyncOperation = {
  Create: _request2.RequestMethod.POST,
  Update: _request2.RequestMethod.PUT,
  Delete: _request2.RequestMethod.DELETE
};
Object.freeze(SyncOperation);
exports.SyncOperation = SyncOperation;

/**
 * @private
 */

var SyncManager = exports.SyncManager = function () {
  function SyncManager(collection) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, SyncManager);

    if (!collection) {
      throw new _errors.SyncError('A collection is required.');
    }

    if (!(0, _isString2.default)(collection)) {
      throw new _errors.SyncError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Client}
     */
    this.client = options.client || _client.Client.sharedInstance();
  }

  /**
   * Pathname used to send sync requests.
   *
   * @return {String} sync pathname
   */


  _createClass(SyncManager, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var query = arguments.length <= 0 || arguments[0] === undefined ? new _query.Query() : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var syncEntities, request;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                syncEntities = [];


                if (!(query instanceof _query.Query)) {
                  query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
                }

                query.equalTo('collection', this.collection);

                // Get all sync entities
                request = new _request2.CacheRequest({
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
                _context.next = 6;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 6:
                syncEntities = _context.sent;
                return _context.abrupt('return', syncEntities);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()

    /**
     * Count the number of entities that are waiting to be synced. A query can be
     * provided to only count a subset of entities.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     */

  }, {
    key: 'count',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2() {
        var query = arguments.length <= 0 || arguments[0] === undefined ? new _query.Query() : arguments[0];
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var syncEntities;
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.find(query, options);

              case 2:
                syncEntities = _context2.sent;
                return _context2.abrupt('return', syncEntities.length);

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function count(_x6, _x7) {
        return _ref2.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'addCreateOperation',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', this.addOperation(SyncOperation.Create, entities, options));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function addCreateOperation(_x10, _x11) {
        return _ref3.apply(this, arguments);
      }

      return addCreateOperation;
    }()
  }, {
    key: 'addUpdateOperation',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', this.addOperation(SyncOperation.Update, entities, options));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function addUpdateOperation(_x13, _x14) {
        return _ref4.apply(this, arguments);
      }

      return addUpdateOperation;
    }()
  }, {
    key: 'addDeleteOperation',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5(entities) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this.addOperation(SyncOperation.Delete, entities, options));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function addDeleteOperation(_x16, _x17) {
        return _ref5.apply(this, arguments);
      }

      return addDeleteOperation;
    }()
  }, {
    key: 'addOperation',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7() {
        var operation = arguments.length <= 0 || arguments[0] === undefined ? SyncOperation.Create : arguments[0];

        var _this = this;

        var entities = arguments[1];
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var singular;
        return _regeneratorRuntime2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                singular = false;

                // Cast the entities to an array

                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                // Process the array of entities
                _context7.next = 4;
                return _es6Promise.Promise.all((0, _map2.default)(entities, function () {
                  var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(entity) {
                    var id, query, findRequest, response, syncEntities, syncEntity, request;
                    return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
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

                            // Find an existing sync operation for the entity
                            query = new _query.Query().equalTo('entityId', id);
                            findRequest = new _request2.CacheRequest({
                              method: _request2.RequestMethod.GET,
                              url: _url2.default.format({
                                protocol: _this.client.protocol,
                                host: _this.client.host,
                                pathname: _this.pathname
                              }),
                              properties: options.properties,
                              query: query,
                              timeout: options.timeout
                            });
                            _context6.next = 9;
                            return findRequest.execute();

                          case 9:
                            response = _context6.sent;
                            syncEntities = response.data;
                            syncEntity = syncEntities.length === 1 ? syncEntities[0] : { collection: _this.collection, state: {}, entityId: id };

                            // Update the state

                            syncEntity.state = syncEntity.state || {};
                            syncEntity.state.method = operation;

                            // Send a request to save the sync entity
                            request = new _request2.CacheRequest({
                              method: _request2.RequestMethod.PUT,
                              url: _url2.default.format({
                                protocol: _this.client.protocol,
                                host: _this.client.host,
                                pathname: _this.pathname
                              }),
                              properties: options.properties,
                              body: syncEntity,
                              timeout: options.timeout
                            });
                            return _context6.abrupt('return', request.execute());

                          case 16:
                          case 'end':
                            return _context6.stop();
                        }
                      }
                    }, _callee6, _this);
                  }));

                  return function (_x24) {
                    return _ref7.apply(this, arguments);
                  };
                }()));

              case 4:
                return _context7.abrupt('return', singular ? entities[0] : entities);

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function addOperation(_x19, _x20, _x21) {
        return _ref6.apply(this, arguments);
      }

      return addOperation;
    }()
  }, {
    key: 'pull',
    value: function () {
      var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var count, config, request, response, networkEntities, clearRequest, saveRequest;
        return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context8.next = 2;
                  break;
                }

                throw new _errors.SyncError('Invalid query. It must be an instance of the Query class.');

              case 2:
                _context8.next = 4;
                return this.count();

              case 4:
                count = _context8.sent;

                if (!(count > 0)) {
                  _context8.next = 11;
                  break;
                }

                _context8.next = 8;
                return this.push();

              case 8:
                _context8.next = 10;
                return this.count();

              case 10:
                count = _context8.sent;

              case 11:
                if (!(count > 0)) {
                  _context8.next = 13;
                  break;
                }

                throw new _errors.SyncError('Unable to pull data from the network.' + (' There are ' + count + ' entities that need') + ' to be synced before data is loaded from the network.');

              case 13:
                config = {
                  method: _request2.RequestMethod.GET,
                  authType: _request2.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.backendPathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                };
                request = new _request2.KinveyRequest(config);

                // Should we use delta fetch?

                if (options.useDeltaFetch === true) {
                  request = new _request2.DeltaFetchRequest(config);
                }

                // Execute the request
                _context8.next = 18;
                return request.execute();

              case 18:
                response = _context8.sent;
                networkEntities = response.data;

                // Clear the cache

                clearRequest = new _request2.CacheRequest({
                  method: _request2.RequestMethod.DELETE,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.backendPathname,
                    query: options.query
                  }),
                  query: query,
                  properties: options.properties,
                  timeout: options.timeout
                });
                _context8.next = 23;
                return clearRequest.execute();

              case 23:

                // Save network entities to cache
                saveRequest = new _request2.CacheRequest({
                  method: _request2.RequestMethod.PUT,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.backendPathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  body: networkEntities,
                  timeout: options.timeout
                });
                _context8.next = 26;
                return saveRequest.execute();

              case 26:
                return _context8.abrupt('return', networkEntities);

              case 27:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function pull(_x25, _x26) {
        return _ref8.apply(this, arguments);
      }

      return pull;
    }()

    /*
     * Sync entities with the network. A query can be provided to
     * sync a subset of entities.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     */

  }, {
    key: 'push',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee14(query) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var batchSize, i, syncEntities, _ret;

        return _regeneratorRuntime2.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                batchSize = 100;
                i = 0;

                // Get the pending sync items

                _context14.next = 4;
                return this.find(query);

              case 4:
                syncEntities = _context14.sent;

                if (!(syncEntities.length > 0)) {
                  _context14.next = 9;
                  break;
                }

                _ret = function () {
                  // Sync the entities in batches to prevent exhausting
                  // available network connections
                  var batchSync = function () {
                    var _ref10 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee13(syncResults) {
                      var promise;
                      return _regeneratorRuntime2.default.wrap(function _callee13$(_context13) {
                        while (1) {
                          switch (_context13.prev = _context13.next) {
                            case 0:
                              promise = new _es6Promise.Promise(function () {
                                var _ref11 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee12(resolve) {
                                  var batch, results;
                                  return _regeneratorRuntime2.default.wrap(function _callee12$(_context12) {
                                    while (1) {
                                      switch (_context12.prev = _context12.next) {
                                        case 0:
                                          batch = syncEntities.slice(i, i + batchSize);

                                          i += batchSize;

                                          // Get the results of syncing all of the entities
                                          _context12.next = 4;
                                          return _es6Promise.Promise.all((0, _map2.default)(batch, function (syncEntity) {
                                            var entityId = syncEntity.entityId;
                                            var state = syncEntity.state;
                                            var method = state.method;


                                            if (method === _request2.RequestMethod.DELETE) {
                                              // Remove the entity from the network.
                                              var request = new _request2.KinveyRequest({
                                                method: _request2.RequestMethod.DELETE,
                                                authType: _request2.AuthType.Default,
                                                url: _url2.default.format({
                                                  protocol: _this2.client.protocol,
                                                  host: _this2.client.host,
                                                  pathname: _this2.backendPathname + '/' + entityId
                                                }),
                                                properties: options.properties,
                                                timeout: options.timeout,
                                                client: _this2.client
                                              });
                                              return request.execute().then(function () {
                                                // Remove the sync entity from the cache
                                                var request = new _request2.CacheRequest({
                                                  method: _request2.RequestMethod.DELETE,
                                                  url: _url2.default.format({
                                                    protocol: _this2.client.protocol,
                                                    host: _this2.client.host,
                                                    pathname: _this2.pathname + '/' + syncEntity[idAttribute]
                                                  }),
                                                  properties: options.properties,
                                                  timeout: options.timeout
                                                });
                                                return request.execute();
                                              }).then(function () {
                                                // Return the result
                                                var result = { _id: entityId };
                                                return result;
                                              }).catch(function () {
                                                var _ref12 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee9(error) {
                                                  var getNetworkRequest, originalEntity, putCacheRequest, deleteSyncRequest;
                                                  return _regeneratorRuntime2.default.wrap(function _callee9$(_context9) {
                                                    while (1) {
                                                      switch (_context9.prev = _context9.next) {
                                                        case 0:
                                                          if (!(error instanceof _errors.InsufficientCredentialsError)) {
                                                            _context9.next = 16;
                                                            break;
                                                          }

                                                          _context9.prev = 1;

                                                          // Get the original entity
                                                          getNetworkRequest = new _request2.KinveyRequest({
                                                            method: _request2.RequestMethod.GET,
                                                            authType: _request2.AuthType.Default,
                                                            url: _url2.default.format({
                                                              protocol: _this2.client.protocol,
                                                              host: _this2.client.host,
                                                              pathname: _this2.backendPathname + '/' + entityId
                                                            }),
                                                            properties: options.properties,
                                                            timeout: options.timeout,
                                                            client: _this2.client
                                                          });
                                                          _context9.next = 5;
                                                          return getNetworkRequest.execute().then(function (response) {
                                                            return response.data;
                                                          });

                                                        case 5:
                                                          originalEntity = _context9.sent;


                                                          // Update the cache with the original entity
                                                          putCacheRequest = new _request2.CacheRequest({
                                                            method: _request2.RequestMethod.PUT,
                                                            url: _url2.default.format({
                                                              protocol: _this2.client.protocol,
                                                              host: _this2.client.host,
                                                              pathname: _this2.backendPathname + '/' + entityId
                                                            }),
                                                            properties: options.properties,
                                                            timeout: options.timeout,
                                                            body: originalEntity
                                                          });
                                                          _context9.next = 9;
                                                          return putCacheRequest.execute();

                                                        case 9:

                                                          // Clear the item from the sync table
                                                          deleteSyncRequest = new _request2.CacheRequest({
                                                            method: _request2.RequestMethod.DELETE,
                                                            url: _url2.default.format({
                                                              protocol: _this2.client.protocol,
                                                              host: _this2.client.host,
                                                              pathname: _this2.pathname + '/' + syncEntity[idAttribute]
                                                            }),
                                                            properties: options.properties,
                                                            timeout: options.timeout
                                                          });
                                                          _context9.next = 12;
                                                          return deleteSyncRequest.execute();

                                                        case 12:
                                                          _context9.next = 16;
                                                          break;

                                                        case 14:
                                                          _context9.prev = 14;
                                                          _context9.t0 = _context9['catch'](1);

                                                        case 16:
                                                          return _context9.abrupt('return', {
                                                            _id: entityId,
                                                            error: error
                                                          });

                                                        case 17:
                                                        case 'end':
                                                          return _context9.stop();
                                                      }
                                                    }
                                                  }, _callee9, _this2, [[1, 14]]);
                                                }));

                                                return function (_x33) {
                                                  return _ref12.apply(this, arguments);
                                                };
                                              }());
                                            } else if (method === _request2.RequestMethod.POST || method === _request2.RequestMethod.PUT) {
                                              // Get the entity from cache
                                              var _request = new _request2.CacheRequest({
                                                method: _request2.RequestMethod.GET,
                                                url: _url2.default.format({
                                                  protocol: _this2.client.protocol,
                                                  host: _this2.client.host,
                                                  pathname: _this2.backendPathname + '/' + entityId
                                                }),
                                                properties: options.properties,
                                                timeout: options.timeout
                                              });
                                              return _request.execute().then(function (response) {
                                                var entity = response.data;

                                                // Save the entity to the backend.
                                                var request = new _request2.KinveyRequest({
                                                  method: method,
                                                  authType: _request2.AuthType.Default,
                                                  url: _url2.default.format({
                                                    protocol: _this2.client.protocol,
                                                    host: _this2.client.host,
                                                    pathname: _this2.backendPathname + '/' + entityId
                                                  }),
                                                  properties: options.properties,
                                                  timeout: options.timeout,
                                                  body: entity,
                                                  client: _this2.client
                                                });

                                                // If the entity was created locally then delete the autogenerated _id,
                                                // send a POST request, and update the url.
                                                if (method === _request2.RequestMethod.POST) {
                                                  delete entity[idAttribute];
                                                  request.method = _request2.RequestMethod.POST;
                                                  request.url = _url2.default.format({
                                                    protocol: _this2.client.protocol,
                                                    host: _this2.client.host,
                                                    pathname: _this2.backendPathname
                                                  });
                                                  request.body = entity;
                                                }

                                                return request.execute().then(function (response) {
                                                  return response.data;
                                                }).then(function () {
                                                  var _ref13 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee10(entity) {
                                                    var deleteRequest, putCacheRequest, deleteCacheRequest;
                                                    return _regeneratorRuntime2.default.wrap(function _callee10$(_context10) {
                                                      while (1) {
                                                        switch (_context10.prev = _context10.next) {
                                                          case 0:
                                                            // Remove the sync entity
                                                            deleteRequest = new _request2.CacheRequest({
                                                              method: _request2.RequestMethod.DELETE,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.pathname + '/' + syncEntity[idAttribute]
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout
                                                            });
                                                            _context10.next = 3;
                                                            return deleteRequest.execute();

                                                          case 3:

                                                            // Save the result of the network request locally.
                                                            putCacheRequest = new _request2.CacheRequest({
                                                              method: _request2.RequestMethod.PUT,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.backendPathname + '/' + entity[idAttribute]
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout,
                                                              body: entity
                                                            });
                                                            _context10.next = 6;
                                                            return putCacheRequest.execute().then(function (response) {
                                                              return response.data;
                                                            });

                                                          case 6:
                                                            entity = _context10.sent;

                                                            if (!(method === _request2.RequestMethod.POST)) {
                                                              _context10.next = 11;
                                                              break;
                                                            }

                                                            deleteCacheRequest = new _request2.CacheRequest({
                                                              method: _request2.RequestMethod.DELETE,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.backendPathname + '/' + entityId
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout
                                                            });
                                                            _context10.next = 11;
                                                            return deleteCacheRequest.execute();

                                                          case 11:
                                                            return _context10.abrupt('return', {
                                                              _id: entityId,
                                                              entity: entity
                                                            });

                                                          case 12:
                                                          case 'end':
                                                            return _context10.stop();
                                                        }
                                                      }
                                                    }, _callee10, _this2);
                                                  }));

                                                  return function (_x34) {
                                                    return _ref13.apply(this, arguments);
                                                  };
                                                }()).catch(function () {
                                                  var _ref14 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee11(error) {
                                                    var getNetworkRequest, originalEntity, putCacheRequest, deleteSyncRequest;
                                                    return _regeneratorRuntime2.default.wrap(function _callee11$(_context11) {
                                                      while (1) {
                                                        switch (_context11.prev = _context11.next) {
                                                          case 0:
                                                            if (!(error instanceof _errors.InsufficientCredentialsError)) {
                                                              _context11.next = 17;
                                                              break;
                                                            }

                                                            _context11.prev = 1;

                                                            if (!(method !== _request2.RequestMethod.POST)) {
                                                              _context11.next = 13;
                                                              break;
                                                            }

                                                            // Get the original entity
                                                            getNetworkRequest = new _request2.KinveyRequest({
                                                              method: _request2.RequestMethod.GET,
                                                              authType: _request2.AuthType.Default,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.backendPathname + '/' + entityId
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout,
                                                              client: _this2.client
                                                            });
                                                            _context11.next = 6;
                                                            return getNetworkRequest.execute().then(function (response) {
                                                              return response.data;
                                                            });

                                                          case 6:
                                                            originalEntity = _context11.sent;


                                                            // Update the cache with the original entity
                                                            putCacheRequest = new _request2.CacheRequest({
                                                              method: _request2.RequestMethod.PUT,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.backendPathname + '/' + entityId
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout,
                                                              body: originalEntity
                                                            });
                                                            _context11.next = 10;
                                                            return putCacheRequest.execute();

                                                          case 10:

                                                            // Clear the item from the sync table
                                                            deleteSyncRequest = new _request2.CacheRequest({
                                                              method: _request2.RequestMethod.DELETE,
                                                              url: _url2.default.format({
                                                                protocol: _this2.client.protocol,
                                                                host: _this2.client.host,
                                                                pathname: _this2.pathname + '/' + syncEntity[idAttribute]
                                                              }),
                                                              properties: options.properties,
                                                              timeout: options.timeout
                                                            });
                                                            _context11.next = 13;
                                                            return deleteSyncRequest.execute();

                                                          case 13:
                                                            _context11.next = 17;
                                                            break;

                                                          case 15:
                                                            _context11.prev = 15;
                                                            _context11.t0 = _context11['catch'](1);

                                                          case 17:
                                                            return _context11.abrupt('return', {
                                                              _id: entityId,
                                                              entity: entity,
                                                              error: error
                                                            });

                                                          case 18:
                                                          case 'end':
                                                            return _context11.stop();
                                                        }
                                                      }
                                                    }, _callee11, _this2, [[1, 15]]);
                                                  }));

                                                  return function (_x35) {
                                                    return _ref14.apply(this, arguments);
                                                  };
                                                }());
                                              });
                                            }

                                            return {
                                              _id: entityId,
                                              entity: undefined,
                                              error: new _errors.SyncError('Unable to sync the entity since the method was not recognized.', syncEntity)
                                            };
                                          }));

                                        case 4:
                                          results = _context12.sent;


                                          // Concat the results
                                          syncResults = syncResults.concat(results);

                                          // Sync the remaining entities

                                          if (!(i < syncEntities.length)) {
                                            _context12.next = 8;
                                            break;
                                          }

                                          return _context12.abrupt('return', resolve(batchSync(syncResults)));

                                        case 8:
                                          return _context12.abrupt('return', resolve(syncResults));

                                        case 9:
                                        case 'end':
                                          return _context12.stop();
                                      }
                                    }
                                  }, _callee12, _this2);
                                }));

                                return function (_x32) {
                                  return _ref11.apply(this, arguments);
                                };
                              }());
                              return _context13.abrupt('return', promise);

                            case 2:
                            case 'end':
                              return _context13.stop();
                          }
                        }
                      }, _callee13, _this2);
                    }));

                    return function batchSync(_x31) {
                      return _ref10.apply(this, arguments);
                    };
                  }();

                  // Return the result
                  return {
                    v: batchSync([])
                  };
                }();

                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                  _context14.next = 9;
                  break;
                }

                return _context14.abrupt('return', _ret.v);

              case 9:
                return _context14.abrupt('return', []);

              case 10:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function push(_x28, _x29) {
        return _ref9.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'sync',
    value: function () {
      var _ref15 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee15(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var push, pull;
        return _regeneratorRuntime2.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return this.push(null, options);

              case 2:
                push = _context15.sent;
                _context15.next = 5;
                return this.pull(query, options);

              case 5:
                pull = _context15.sent;
                return _context15.abrupt('return', {
                  push: push,
                  pull: pull
                });

              case 7:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function sync(_x36, _x37) {
        return _ref15.apply(this, arguments);
      }

      return sync;
    }()

    /**
     * Clear the sync table. A query can be provided to
     * only clear a subset of the sync table.
     *
     * @param   {Query}         [query]                     Query
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     */

  }, {
    key: 'clear',
    value: function clear() {
      var query = arguments.length <= 0 || arguments[0] === undefined ? new _query.Query() : arguments[0];
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!(query instanceof _query.Query)) {
        query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
      }
      query.equalTo('collection', this.collection);

      var request = new _request2.CacheRequest({
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

    /**
     * Pathname used to send backend requests.
     *
     * @return {String} sync pathname
     */

  }, {
    key: 'backendPathname',
    get: function get() {
      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + this.collection;
    }
  }]);

  return SyncManager;
}();
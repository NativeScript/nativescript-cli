'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _enums = require('./enums');

var _errors = require('./errors');

var _metadata = require('./metadata');

var _local = require('./requests/local');

var _network = require('./requests/network');

var _client = require('./client');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _mapSeries = require('async/mapSeries');

var _mapSeries2 = _interopRequireDefault(_mapSeries);

var _parallel = require('async/parallel');

var _parallel2 = _interopRequireDefault(_parallel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _babybird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _babybird2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = undefined || 'appdata';
var syncCollectionName = undefined || 'kinvey_sync';
var idAttribute = undefined || '_id';
var kmdAttribute = undefined || '_kmd';

var Sync = function () {
  function Sync() {
    _classCallCheck(this, Sync);

    /**
     * @private
     * @type {Client}
     */
    this.client = _client.Client.sharedInstance();
  }

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
        var request, syncEntities;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // Get all sync entities
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
                _context.next = 3;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 3:
                syncEntities = _context.sent;
                return _context.abrupt('return', (0, _reduce2.default)(syncEntities, function (sum, syncEntity) {
                  return sum + syncEntity.size;
                }, 0));

              case 5:
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
     * Add entities to the sync table. You can add a single entity or an array
     * of entities. Each entity must have an _id.
     *
     * @param   {String}        name                        Collection name for entities.
     * @param   {Object|Array}  entiies                     Entities to add to the sync table.
     * @param   {Object}        [options={}]                Options
     * @param   {Number}        [options.timeout]           Timeout for the request.
     * @return  {Promise}                                   Promise
     *
     * @example
     * var entities = [{
     *   _id: '1',
     *   prop: 'value'
     * }];
     * var promise = sync.notify('collectionName', entities).then(function(entities) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */

  }, {
    key: 'notify',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(name, entities) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var singular, getRequest, syncEntity, putRequest;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                singular = false;

                // Check that a name was provided

                if (name) {
                  _context2.next = 3;
                  break;
                }

                throw new _errors.KinveyError('A name for a collection must be provided to add entities to the sync table.');

              case 3:
                if (entities) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return', null);

              case 5:

                // Get the sync entity for the collection
                getRequest = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/' + name
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                syncEntity = {
                  _id: name,
                  entities: {},
                  size: 0
                };
                _context2.prev = 7;
                _context2.next = 10;
                return getRequest.execute().then(function (response) {
                  return response.data;
                });

              case 10:
                syncEntity = _context2.sent;
                _context2.next = 17;
                break;

              case 13:
                _context2.prev = 13;
                _context2.t0 = _context2['catch'](7);

                if (_context2.t0 instanceof _errors.NotFoundError) {
                  _context2.next = 17;
                  break;
                }

                throw _context2.t0;

              case 17:

                // Cast entities to an array
                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                // Loop through all the entities and update
                // the sync entity
                (0, _forEach2.default)(entities, function (entity) {
                  var id = entity[idAttribute];

                  if (!id) {
                    throw new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity);
                  }

                  if (!syncEntity.entities.hasOwnProperty(id)) {
                    syncEntity.size = syncEntity.size + 1;
                  }

                  syncEntity.entities[id] = {};
                });

                // Update the sync entity in the sync table
                putRequest = new _local.LocalRequest({
                  method: _enums.HttpMethod.PUT,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  data: syncEntity,
                  client: this.client
                });
                _context2.next = 22;
                return putRequest.execute();

              case 22:
                return _context2.abrupt('return', singular ? entities[0] : entities);

              case 23:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[7, 13]]);
      }));

      function notify(_x4, _x5, _x6) {
        return ref.apply(this, arguments);
      }

      return notify;
    }()
  }, {
    key: 'execute',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(query) {
        var _this = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, syncEntities;
        return regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                // Make a request for the pending sync entities
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
                _context12.next = 3;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 3:
                syncEntities = _context12.sent;
                return _context12.abrupt('return', new _babybird2.default(function (resolve, reject) {
                  // Sync each individual entity in series
                  (0, _mapSeries2.default)(syncEntities, function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(syncEntity, callback) {
                      var collectionName, syncSize, entities, ids, syncResult, batchSize, i, batchSync, result, _request3;

                      return regeneratorRuntime.wrap(function _callee11$(_context11) {
                        while (1) {
                          switch (_context11.prev = _context11.next) {
                            case 0:
                              collectionName = syncEntity._id;
                              syncSize = syncEntity.size;
                              entities = syncEntity.entities;
                              ids = Object.keys(entities);
                              syncResult = { collection: collectionName, success: [], error: [] };
                              batchSize = 100;
                              i = 0;

                              // Sync the entities in batches to prevent exhausting
                              // available network connections

                              batchSync = function () {
                                var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
                                  var promise;
                                  return regeneratorRuntime.wrap(function _callee10$(_context10) {
                                    while (1) {
                                      switch (_context10.prev = _context10.next) {
                                        case 0:
                                          promise = new _babybird2.default(function () {
                                            var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(resolve, reject) {
                                              var batchIds, save, remove;
                                              return regeneratorRuntime.wrap(function _callee9$(_context9) {
                                                while (1) {
                                                  switch (_context9.prev = _context9.next) {
                                                    case 0:
                                                      batchIds = ids.slice(i, i + batchSize);

                                                      i += batchSize;
                                                      save = [];
                                                      remove = [];

                                                      // Look up then entities by id. If the entity is found
                                                      // then peform an POST/PUT operation to the Network. If the
                                                      // entity is not found then perform a DELETE operation
                                                      // to the Network.

                                                      _context9.next = 6;
                                                      return _babybird2.default.all((0, _map2.default)(batchIds, function () {
                                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(id) {
                                                          var _request, entity;

                                                          return regeneratorRuntime.wrap(function _callee3$(_context3) {
                                                            while (1) {
                                                              switch (_context3.prev = _context3.next) {
                                                                case 0:
                                                                  _context3.prev = 0;
                                                                  _request = new _local.LocalRequest({
                                                                    method: _enums.HttpMethod.GET,
                                                                    url: _url2.default.format({
                                                                      protocol: _this.client.protocol,
                                                                      host: _this.client.host,
                                                                      pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + id
                                                                    }),
                                                                    properties: options.properties,
                                                                    timeout: options.timeout,
                                                                    client: _this.client
                                                                  });
                                                                  _context3.next = 4;
                                                                  return _request.execute().then(function (response) {
                                                                    return response.data;
                                                                  });

                                                                case 4:
                                                                  entity = _context3.sent;
                                                                  return _context3.abrupt('return', save.push(entity));

                                                                case 8:
                                                                  _context3.prev = 8;
                                                                  _context3.t0 = _context3['catch'](0);

                                                                  if (!(_context3.t0 instanceof _errors.NotFoundError)) {
                                                                    _context3.next = 12;
                                                                    break;
                                                                  }

                                                                  return _context3.abrupt('return', remove.push(id));

                                                                case 12:
                                                                  throw _context3.t0;

                                                                case 13:
                                                                case 'end':
                                                                  return _context3.stop();
                                                              }
                                                            }
                                                          }, _callee3, _this, [[0, 8]]);
                                                        }));

                                                        return function (_x15) {
                                                          return ref.apply(this, arguments);
                                                        };
                                                      }()));

                                                    case 6:

                                                      // Execute PUT/POST operations and DELETE operations
                                                      // in parallel
                                                      (0, _parallel2.default)({
                                                        saved: function () {
                                                          var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(callback) {
                                                            var saved;
                                                            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                                                              while (1) {
                                                                switch (_context5.prev = _context5.next) {
                                                                  case 0:
                                                                    _context5.next = 2;
                                                                    return _babybird2.default.all((0, _map2.default)(save, function () {
                                                                      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(entity) {
                                                                        var metadata, originalId, putNetworkRequest, putLocalRequest, deleteLocalRequest, getNetworkRequest, originalEntity, _putLocalRequest;

                                                                        return regeneratorRuntime.wrap(function _callee4$(_context4) {
                                                                          while (1) {
                                                                            switch (_context4.prev = _context4.next) {
                                                                              case 0:
                                                                                metadata = new _metadata.Metadata(entity);
                                                                                originalId = entity[idAttribute];

                                                                                delete entity[kmdAttribute];

                                                                                _context4.prev = 3;

                                                                                // Save the entity to the network.
                                                                                putNetworkRequest = new _network.NetworkRequest({
                                                                                  method: _enums.HttpMethod.PUT,
                                                                                  authType: _enums.AuthType.Default,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + originalId
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  data: entity,
                                                                                  client: _this.client
                                                                                });


                                                                                if (metadata.isLocal()) {
                                                                                  delete entity[idAttribute];
                                                                                  request.method = _enums.HttpMethod.POST;
                                                                                  request.url = _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName
                                                                                  });
                                                                                  request.data = entity;
                                                                                }

                                                                                _context4.next = 8;
                                                                                return putNetworkRequest.execute().then(function (response) {
                                                                                  return response.data;
                                                                                });

                                                                              case 8:
                                                                                entity = _context4.sent;


                                                                                // Save the result of the network request locally.
                                                                                putLocalRequest = new _local.LocalRequest({
                                                                                  method: _enums.HttpMethod.PUT,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + entity[idAttribute]
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  data: entity,
                                                                                  client: _this.client
                                                                                });

                                                                                entity = putLocalRequest.execute().then(function (response) {
                                                                                  return response.data;
                                                                                });

                                                                                // Remove the original entity if it was created on the device
                                                                                // using the SDK.

                                                                                if (!metadata.isLocal()) {
                                                                                  _context4.next = 15;
                                                                                  break;
                                                                                }

                                                                                deleteLocalRequest = new _local.LocalRequest({
                                                                                  method: _enums.HttpMethod.DELETE,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + originalId
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  client: _this.client
                                                                                });
                                                                                _context4.next = 15;
                                                                                return deleteLocalRequest.execute();

                                                                              case 15:

                                                                                // Reduce the syncSize by 1 and delete the entry for the
                                                                                // entity.
                                                                                syncSize = syncSize - 1;
                                                                                delete entities[originalId];

                                                                                // Return the result of the sync operation.
                                                                                return _context4.abrupt('return', {
                                                                                  _id: originalId,
                                                                                  entity: entity
                                                                                });

                                                                              case 20:
                                                                                _context4.prev = 20;
                                                                                _context4.t0 = _context4['catch'](3);

                                                                                if (!(_context4.t0 instanceof _errors.InsufficientCredentialsError)) {
                                                                                  _context4.next = 40;
                                                                                  break;
                                                                                }

                                                                                _context4.prev = 23;

                                                                                if (metadata.isLocal()) {
                                                                                  _context4.next = 32;
                                                                                  break;
                                                                                }

                                                                                getNetworkRequest = new _network.NetworkRequest({
                                                                                  method: _enums.HttpMethod.GET,
                                                                                  authType: _enums.AuthType.Default,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + originalId
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  client: _this.client
                                                                                });
                                                                                _context4.next = 28;
                                                                                return getNetworkRequest.execute().then(function (response) {
                                                                                  return response.data;
                                                                                });

                                                                              case 28:
                                                                                originalEntity = _context4.sent;
                                                                                _putLocalRequest = new _local.LocalRequest({
                                                                                  method: _enums.HttpMethod.PUT,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + originalId
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  data: originalEntity,
                                                                                  client: _this.client
                                                                                });
                                                                                _context4.next = 32;
                                                                                return _putLocalRequest.execute();

                                                                              case 32:
                                                                                _context4.next = 38;
                                                                                break;

                                                                              case 34:
                                                                                _context4.prev = 34;
                                                                                _context4.t1 = _context4['catch'](23);

                                                                                if (_context4.t1 instanceof _errors.NotFoundError) {
                                                                                  _context4.next = 38;
                                                                                  break;
                                                                                }

                                                                                throw _context4.t1;

                                                                              case 38:

                                                                                // Reduce the syncSize by 1 and delete the entry for the
                                                                                // entity.
                                                                                syncSize = syncSize - 1;
                                                                                delete entities[originalId];

                                                                              case 40:
                                                                                return _context4.abrupt('return', {
                                                                                  _id: originalId,
                                                                                  error: _context4.t0
                                                                                });

                                                                              case 41:
                                                                              case 'end':
                                                                                return _context4.stop();
                                                                            }
                                                                          }
                                                                        }, _callee4, _this, [[3, 20], [23, 34]]);
                                                                      }));

                                                                      return function (_x17) {
                                                                        return ref.apply(this, arguments);
                                                                      };
                                                                    }()));

                                                                  case 2:
                                                                    saved = _context5.sent;


                                                                    // Call the callback with the result of the saved operations.
                                                                    callback(null, saved);

                                                                  case 4:
                                                                  case 'end':
                                                                    return _context5.stop();
                                                                }
                                                              }
                                                            }, _callee5, _this);
                                                          }));

                                                          return function saved(_x16) {
                                                            return ref.apply(this, arguments);
                                                          };
                                                        }(),
                                                        removed: function () {
                                                          var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(callback) {
                                                            var removed;
                                                            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                                                              while (1) {
                                                                switch (_context7.prev = _context7.next) {
                                                                  case 0:
                                                                    _context7.next = 2;
                                                                    return _babybird2.default.all((0, _map2.default)(remove, function () {
                                                                      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(id) {
                                                                        var _request2, getNetworkRequest, originalEntity, putLocalRequest;

                                                                        return regeneratorRuntime.wrap(function _callee6$(_context6) {
                                                                          while (1) {
                                                                            switch (_context6.prev = _context6.next) {
                                                                              case 0:
                                                                                _context6.prev = 0;

                                                                                // Remove the entity from the network.
                                                                                _request2 = new _network.NetworkRequest({
                                                                                  method: _enums.HttpMethod.DELETE,
                                                                                  authType: _enums.AuthType.Default,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + id
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  client: _this.client
                                                                                });
                                                                                _context6.next = 4;
                                                                                return _request2.execute();

                                                                              case 4:

                                                                                // Reduce the syncSize by 1 and delete the entry for the
                                                                                // entity.
                                                                                syncSize = syncSize - 1;
                                                                                delete entities[id];

                                                                                // Return the result of the sync operation.
                                                                                return _context6.abrupt('return', {
                                                                                  _id: id
                                                                                });

                                                                              case 9:
                                                                                _context6.prev = 9;
                                                                                _context6.t0 = _context6['catch'](0);

                                                                                // If the entity was not found on the network then
                                                                                // we should just remove the entity from the sync table.
                                                                                // This is the result that was intended from the
                                                                                // sync operation.
                                                                                if (_context6.t0 instanceof _errors.NotFoundError) {
                                                                                  // Reduce the syncSize by 1 and delete the entry for the
                                                                                  // entity.
                                                                                  syncSize = syncSize - 1;
                                                                                  delete entities[id];
                                                                                }

                                                                                // If the credentials used to authenticate this request are
                                                                                // not authorized to run the operation

                                                                                if (!(_context6.t0 instanceof _errors.InsufficientCredentialsError)) {
                                                                                  _context6.next = 29;
                                                                                  break;
                                                                                }

                                                                                _context6.prev = 13;

                                                                                // Try and reset the state of the entity
                                                                                getNetworkRequest = new _network.NetworkRequest({
                                                                                  method: _enums.HttpMethod.GET,
                                                                                  authType: _enums.AuthType.Default,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + id
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  client: _this.client
                                                                                });
                                                                                _context6.next = 17;
                                                                                return getNetworkRequest.execute().then(function (response) {
                                                                                  return response.data;
                                                                                });

                                                                              case 17:
                                                                                originalEntity = _context6.sent;
                                                                                putLocalRequest = new _local.LocalRequest({
                                                                                  method: _enums.HttpMethod.PUT,
                                                                                  url: _url2.default.format({
                                                                                    protocol: _this.client.protocol,
                                                                                    host: _this.client.host,
                                                                                    pathname: '/' + appdataNamespace + '/' + _this.client.appKey + '/' + collectionName + '/' + id
                                                                                  }),
                                                                                  properties: options.properties,
                                                                                  timeout: options.timeout,
                                                                                  data: originalEntity,
                                                                                  client: _this.client
                                                                                });
                                                                                _context6.next = 21;
                                                                                return putLocalRequest.execute();

                                                                              case 21:
                                                                                _context6.next = 27;
                                                                                break;

                                                                              case 23:
                                                                                _context6.prev = 23;
                                                                                _context6.t1 = _context6['catch'](13);

                                                                                if (_context6.t1 instanceof _errors.NotFoundError) {
                                                                                  _context6.next = 27;
                                                                                  break;
                                                                                }

                                                                                throw _context6.t1;

                                                                              case 27:

                                                                                // Reduce the syncSize by 1 and delete the entry for the
                                                                                // entity.
                                                                                syncSize = syncSize - 1;
                                                                                delete entities[id];

                                                                              case 29:
                                                                                return _context6.abrupt('return', {
                                                                                  _id: id,
                                                                                  error: _context6.t0
                                                                                });

                                                                              case 30:
                                                                              case 'end':
                                                                                return _context6.stop();
                                                                            }
                                                                          }
                                                                        }, _callee6, _this, [[0, 9], [13, 23]]);
                                                                      }));

                                                                      return function (_x19) {
                                                                        return ref.apply(this, arguments);
                                                                      };
                                                                    }()));

                                                                  case 2:
                                                                    removed = _context7.sent;


                                                                    // Call the callback with the result of the
                                                                    // remove operations.
                                                                    callback(null, removed);

                                                                  case 4:
                                                                  case 'end':
                                                                    return _context7.stop();
                                                                }
                                                              }
                                                            }, _callee7, _this);
                                                          }));

                                                          return function removed(_x18) {
                                                            return ref.apply(this, arguments);
                                                          };
                                                        }()
                                                      }, function () {
                                                        var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(error, _ref) {
                                                          var saved = _ref.saved;
                                                          var removed = _ref.removed;
                                                          var result;
                                                          return regeneratorRuntime.wrap(function _callee8$(_context8) {
                                                            while (1) {
                                                              switch (_context8.prev = _context8.next) {
                                                                case 0:
                                                                  if (!error) {
                                                                    _context8.next = 2;
                                                                    break;
                                                                  }

                                                                  return _context8.abrupt('return', reject(error));

                                                                case 2:
                                                                  result = {
                                                                    collection: collectionName,
                                                                    success: [],
                                                                    error: []
                                                                  };


                                                                  (0, _forEach2.default)(saved, function (savedResult) {
                                                                    if (savedResult.error) {
                                                                      result.error.push(savedResult);
                                                                    } else {
                                                                      result.success.push(savedResult);
                                                                    }
                                                                  });

                                                                  (0, _forEach2.default)(removed, function (removedResult) {
                                                                    if (removedResult.error) {
                                                                      result.error.push(removedResult);
                                                                    } else {
                                                                      result.success.push(removedResult);
                                                                    }
                                                                  });

                                                                  syncResult.success = syncResult.success.concat(result.success);
                                                                  syncResult.error = syncResult.error.concat(result.error);

                                                                  if (!(i < ids.length)) {
                                                                    _context8.next = 12;
                                                                    break;
                                                                  }

                                                                  _context8.next = 10;
                                                                  return batchSync();

                                                                case 10:
                                                                  _context8.t0 = _context8.sent;
                                                                  return _context8.abrupt('return', resolve(_context8.t0));

                                                                case 12:
                                                                  return _context8.abrupt('return', resolve(syncResult));

                                                                case 13:
                                                                case 'end':
                                                                  return _context8.stop();
                                                              }
                                                            }
                                                          }, _callee8, _this);
                                                        }));

                                                        return function (_x20, _x21) {
                                                          return ref.apply(this, arguments);
                                                        };
                                                      }());

                                                    case 7:
                                                    case 'end':
                                                      return _context9.stop();
                                                  }
                                                }
                                              }, _callee9, _this);
                                            }));

                                            return function (_x13, _x14) {
                                              return ref.apply(this, arguments);
                                            };
                                          }());
                                          return _context10.abrupt('return', promise);

                                        case 2:
                                        case 'end':
                                          return _context10.stop();
                                      }
                                    }
                                  }, _callee10, _this);
                                }));

                                return function batchSync() {
                                  return ref.apply(this, arguments);
                                };
                              }();

                              _context11.prev = 8;
                              _context11.next = 11;
                              return batchSync();

                            case 11:
                              result = _context11.sent;


                              // Update the sync table.
                              syncEntity.size = syncSize;
                              syncEntity.entities = entities;
                              _request3 = new _local.LocalRequest({
                                method: _enums.HttpMethod.PUT,
                                url: _url2.default.format({
                                  protocol: _this.client.protocol,
                                  host: _this.client.host,
                                  pathname: _this._pathname + '/' + syncEntity[idAttribute]
                                }),
                                properties: options.properties,
                                timeout: options.timeout,
                                data: syncEntity,
                                client: _this.client
                              });
                              _context11.next = 17;
                              return _request3.execute();

                            case 17:

                              // Call the callback with the result of sync.
                              callback(null, result);
                              _context11.next = 23;
                              break;

                            case 20:
                              _context11.prev = 20;
                              _context11.t0 = _context11['catch'](8);

                              callback(_context11.t0);

                            case 23:
                            case 'end':
                              return _context11.stop();
                          }
                        }
                      }, _callee11, _this, [[8, 20]]);
                    }));

                    return function (_x11, _x12) {
                      return ref.apply(this, arguments);
                    };
                  }(), function (error, results) {
                    if (error) {
                      return reject(error);
                    }

                    // Return the results of sync.
                    return results.length === 1 ? resolve(results[0]) : resolve(results);
                  });
                }));

              case 5:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function execute(_x8, _x9) {
        return ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'clear',
    value: function clear(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var request = new _local.LocalRequest({
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
      return request.execute();
    }
  }, {
    key: '_pathname',
    get: function get() {
      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + syncCollectionName;
    }
  }]);

  return Sync;
}();

exports.default = Sync;
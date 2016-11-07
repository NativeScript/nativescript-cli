'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncOperation = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request5 = require('../../request');

var _errors = require('../../errors');

var _client = require('../../client');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || undefined || 'appdata';
var syncCollectionName = process && process.env && process.env.KINVEY_SYNC_COLLECTION_NAME || undefined || 'kinvey_sync';

var SyncOperation = {
  Create: _request5.RequestMethod.POST,
  Update: _request5.RequestMethod.PUT,
  Delete: _request5.RequestMethod.DELETE
};
Object.freeze(SyncOperation);
exports.SyncOperation = SyncOperation;

var SyncManager = function () {
  function SyncManager(collection) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SyncManager);

    if (!collection) {
      throw new _errors.SyncError('A collection is required.');
    }

    if (!(0, _isString2.default)(collection)) {
      throw new _errors.SyncError('Collection must be a string.');
    }

    this.collection = collection;

    this.client = options.client || _client.Client.sharedInstance();
  }

  _createClass(SyncManager, [{
    key: 'find',
    value: function find() {
      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new _query2.default();
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!(query instanceof _query2.default)) {
        query = new _query2.default((0, _result2.default)(query, 'toJSON', query));
      }

      query.equalTo('collection', this.collection);

      var request = new _request5.CacheRequest({
        method: _request5.RequestMethod.GET,
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
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'count',
    value: function count() {
      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new _query2.default();
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.find(query, options).then(function (entities) {
        return entities.length;
      });
    }
  }, {
    key: 'addCreateOperation',
    value: function addCreateOperation(entities) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.addOperation(SyncOperation.Create, entities, options);
    }
  }, {
    key: 'addUpdateOperation',
    value: function addUpdateOperation(entities) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.addOperation(SyncOperation.Update, entities, options);
    }
  }, {
    key: 'addDeleteOperation',
    value: function addDeleteOperation(entities) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.addOperation(SyncOperation.Delete, entities, options);
    }
  }, {
    key: 'addOperation',
    value: function addOperation() {
      var operation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : SyncOperation.Create;

      var _this = this;

      var entities = arguments[1];
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var singular = false;

      if (!(0, _isArray2.default)(entities)) {
        singular = true;
        entities = [entities];
      }

      return _es6Promise2.default.all((0, _map2.default)(entities, function (entity) {
        if (!entity) {
          return _es6Promise2.default.resolve(null);
        }

        var id = entity._id;
        if (!id) {
          return _es6Promise2.default.reject(new _errors.SyncError('An entity is missing an _id. All entities must have an _id in order to be ' + 'added to the sync table.', entity));
        }

        var query = new _query2.default().equalTo('entityId', id);
        var findRequest = new _request5.CacheRequest({
          method: _request5.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this.client.protocol,
            host: _this.client.host,
            pathname: _this.pathname
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });
        return findRequest.execute().then(function (response) {
          return response.data;
        }).then(function (entities) {
          var syncEntity = entities.length === 1 ? entities[0] : { collection: _this.collection, state: {}, entityId: id };

          syncEntity.state = syncEntity.state || {};
          syncEntity.state.method = operation;

          var request = new _request5.CacheRequest({
            method: _request5.RequestMethod.PUT,
            url: _url2.default.format({
              protocol: _this.client.protocol,
              host: _this.client.host,
              pathname: _this.pathname
            }),
            properties: options.properties,
            body: syncEntity,
            timeout: options.timeout
          });
          return request.execute();
        });
      })).then(function () {
        if (singular === true) {
          return entities[0];
        }

        return entities;
      });
    }
  }, {
    key: 'pull',
    value: function pull(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (query && !(query instanceof _query2.default)) {
        return _es6Promise2.default.reject(new _errors.SyncError('Invalid query. It must be an instance of the Query class.'));
      }

      return this.count().then(function (count) {
        if (count > 0) {
          return _this2.push().then(function () {
            return _this2.count;
          });
        }

        return count;
      }).then(function (count) {
        if (count > 0) {
          throw new _errors.SyncError('Unable to pull data from the network.' + (' There are ' + count + ' entities that need') + ' to be synced before data is loaded from the network.');
        }

        var config = {
          method: _request5.RequestMethod.GET,
          authType: _request5.AuthType.Default,
          url: _url2.default.format({
            protocol: _this2.client.protocol,
            host: _this2.client.host,
            pathname: _this2.backendPathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: _this2.client
        };
        var request = new _request5.KinveyRequest(config);

        if (options.useDeltaFetch === true) {
          request = new _request5.DeltaFetchRequest(config);
        }

        return request.execute();
      }).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'push',
    value: function push(query) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var batchSize = 100;
      var i = 0;

      return this.find(query).then(function (syncEntities) {
        if (syncEntities.length > 0) {
          var _ret = function () {
            var batchSync = function batchSync(syncResults) {
              var promise = new _es6Promise2.default(function (resolve) {
                var batch = syncEntities.slice(i, i + batchSize);
                i += batchSize;

                return _es6Promise2.default.all((0, _map2.default)(batch, function (syncEntity) {
                  var entityId = syncEntity.entityId;
                  var state = syncEntity.state;
                  var method = state.method;


                  if (method === _request5.RequestMethod.DELETE) {
                    var request = new _request5.KinveyRequest({
                      method: _request5.RequestMethod.DELETE,
                      authType: _request5.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this3.client.protocol,
                        host: _this3.client.host,
                        pathname: _this3.backendPathname + '/' + entityId
                      }),
                      properties: options.properties,
                      timeout: options.timeout,
                      client: _this3.client
                    });
                    return request.execute().then(function () {
                      var request = new _request5.CacheRequest({
                        method: _request5.RequestMethod.DELETE,
                        url: _url2.default.format({
                          protocol: _this3.client.protocol,
                          host: _this3.client.host,
                          pathname: _this3.pathname + '/' + syncEntity._id
                        }),
                        properties: options.properties,
                        timeout: options.timeout
                      });
                      return request.execute();
                    }).then(function () {
                      var result = { _id: entityId };
                      return result;
                    }).catch(function (error) {
                      if (error instanceof _errors.InsufficientCredentialsError) {
                        var _request = new _request5.KinveyRequest({
                          method: _request5.RequestMethod.GET,
                          authType: _request5.AuthType.Default,
                          url: _url2.default.format({
                            protocol: _this3.client.protocol,
                            host: _this3.client.host,
                            pathname: _this3.backendPathname + '/' + entityId
                          }),
                          properties: options.properties,
                          timeout: options.timeout,
                          client: _this3.client
                        });
                        return _request.execute().then(function (response) {
                          return response.data;
                        }).then(function (originalEntity) {
                          var request = new _request5.CacheRequest({
                            method: _request5.RequestMethod.PUT,
                            url: _url2.default.format({
                              protocol: _this3.client.protocol,
                              host: _this3.client.host,
                              pathname: _this3.backendPathname + '/' + entityId
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            body: originalEntity
                          });
                          return request.execute();
                        }).then(function () {
                          var request = new _request5.CacheRequest({
                            method: _request5.RequestMethod.DELETE,
                            url: _url2.default.format({
                              protocol: _this3.client.protocol,
                              host: _this3.client.host,
                              pathname: _this3.pathname + '/' + syncEntity._id
                            }),
                            properties: options.properties,
                            timeout: options.timeout
                          });
                          return request.execute();
                        }).catch(function () {
                          throw error;
                        });
                      }

                      throw error;
                    }).catch(function (error) {
                      var result = {
                        _id: entityId,
                        error: error
                      };
                      return result;
                    });
                  } else if (method === _request5.RequestMethod.POST || method === _request5.RequestMethod.PUT) {
                    var _request2 = new _request5.CacheRequest({
                      method: _request5.RequestMethod.GET,
                      url: _url2.default.format({
                        protocol: _this3.client.protocol,
                        host: _this3.client.host,
                        pathname: _this3.backendPathname + '/' + entityId
                      }),
                      properties: options.properties,
                      timeout: options.timeout
                    });
                    return _request2.execute().then(function (response) {
                      var entity = response.data;

                      var request = new _request5.KinveyRequest({
                        method: method,
                        authType: _request5.AuthType.Default,
                        url: _url2.default.format({
                          protocol: _this3.client.protocol,
                          host: _this3.client.host,
                          pathname: _this3.backendPathname + '/' + entityId
                        }),
                        properties: options.properties,
                        timeout: options.timeout,
                        body: entity,
                        client: _this3.client
                      });

                      if (method === _request5.RequestMethod.POST) {
                        delete entity._id;
                        request.method = _request5.RequestMethod.POST;
                        request.url = _url2.default.format({
                          protocol: _this3.client.protocol,
                          host: _this3.client.host,
                          pathname: _this3.backendPathname
                        });
                        request.body = entity;
                      }

                      return request.execute().then(function (response) {
                        return response.data;
                      }).then(function (entity) {
                        var request = new _request5.CacheRequest({
                          method: _request5.RequestMethod.DELETE,
                          url: _url2.default.format({
                            protocol: _this3.client.protocol,
                            host: _this3.client.host,
                            pathname: _this3.pathname + '/' + syncEntity._id
                          }),
                          properties: options.properties,
                          timeout: options.timeout
                        });
                        return request.execute().then(function () {
                          var request = new _request5.CacheRequest({
                            method: _request5.RequestMethod.PUT,
                            url: _url2.default.format({
                              protocol: _this3.client.protocol,
                              host: _this3.client.host,
                              pathname: _this3.backendPathname + '/' + entity._id
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            body: entity
                          });
                          return request.execute().then(function (response) {
                            return response.data;
                          });
                        }).then(function (entity) {
                          if (method === _request5.RequestMethod.POST) {
                            var _request3 = new _request5.CacheRequest({
                              method: _request5.RequestMethod.DELETE,
                              url: _url2.default.format({
                                protocol: _this3.client.protocol,
                                host: _this3.client.host,
                                pathname: _this3.backendPathname + '/' + entityId
                              }),
                              properties: options.properties,
                              timeout: options.timeout
                            });

                            return _request3.execute().then(function () {
                              return entity;
                            });
                          }

                          return entity;
                        }).then(function (entity) {
                          var result = {
                            _id: entityId,
                            entity: entity
                          };
                          return result;
                        });
                      }).catch(function (error) {
                        if (error instanceof _errors.InsufficientCredentialsError) {
                          var _request4 = new _request5.KinveyRequest({
                            method: _request5.RequestMethod.GET,
                            authType: _request5.AuthType.Default,
                            url: _url2.default.format({
                              protocol: _this3.client.protocol,
                              host: _this3.client.host,
                              pathname: _this3.backendPathname + '/' + entityId
                            }),
                            properties: options.properties,
                            timeout: options.timeout,
                            client: _this3.client
                          });
                          return _request4.execute().then(function (response) {
                            return response.data;
                          }).then(function (originalEntity) {
                            var request = new _request5.CacheRequest({
                              method: _request5.RequestMethod.PUT,
                              url: _url2.default.format({
                                protocol: _this3.client.protocol,
                                host: _this3.client.host,
                                pathname: _this3.backendPathname + '/' + entityId
                              }),
                              properties: options.properties,
                              timeout: options.timeout,
                              body: originalEntity
                            });
                            return request.execute();
                          }).then(function () {
                            var request = new _request5.CacheRequest({
                              method: _request5.RequestMethod.DELETE,
                              url: _url2.default.format({
                                protocol: _this3.client.protocol,
                                host: _this3.client.host,
                                pathname: _this3.pathname + '/' + syncEntity._id
                              }),
                              properties: options.properties,
                              timeout: options.timeout
                            });
                            return request.execute();
                          }).catch(function () {
                            throw error;
                          });
                        }

                        throw error;
                      }).catch(function (error) {
                        var result = {
                          _id: entityId,
                          entity: entity,
                          error: error
                        };
                        return result;
                      });
                    }).catch(function (error) {
                      var result = {
                        _id: entityId,
                        entity: undefined,
                        error: error
                      };
                      return result;
                    });
                  }

                  return {
                    _id: entityId,
                    entity: undefined,
                    error: new _errors.SyncError('Unable to sync the entity since the method was not recognized.', syncEntity)
                  };
                })).then(function (results) {
                  syncResults = syncResults.concat(results);

                  if (i < syncEntities.length) {
                    return resolve(batchSync(syncResults));
                  }

                  return resolve(syncResults);
                });
              });
              return promise;
            };

            return {
              v: batchSync([])
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        return [];
      });
    }
  }, {
    key: 'sync',
    value: function sync(query) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.push(null, options).then(function (push) {
        var promise = _this4.pull(query, options).then(function (pull) {
          var result = {
            push: push,
            pull: pull
          };
          return result;
        });
        return promise;
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this5 = this;

      var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new _query2.default();
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (!(query instanceof _query2.default)) {
        query = new _query2.default(query);
      }
      query.equalTo('collection', this.collection);

      var request = new _request5.CacheRequest({
        method: _request5.RequestMethod.GET,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout
      });
      return request.execute().then(function (response) {
        return response.data;
      }).then(function (entities) {
        var request = new _request5.CacheRequest({
          method: _request5.RequestMethod.DELETE,
          url: _url2.default.format({
            protocol: _this5.client.protocol,
            host: _this5.client.host,
            pathname: _this5.pathname
          }),
          properties: options.properties,
          body: entities,
          timeout: options.timeout
        });
        return request.execute().then(function (response) {
          return response.data;
        });
      });
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + syncCollectionName;
    }
  }, {
    key: 'backendPathname',
    get: function get() {
      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + this.collection;
    }
  }]);

  return SyncManager;
}();

exports.default = SyncManager;
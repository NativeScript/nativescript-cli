'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _request = require('../../request');

var _errors = require('../../errors');

var _query3 = require('../../query');

var _query4 = _interopRequireDefault(_query3);

var _aggregation = require('../../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _sync = require('./sync');

var _sync2 = _interopRequireDefault(_sync);

var _entity = require('../../entity');

var _utils = require('../../utils');

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CacheStore = function (_NetworkStore) {
  _inherits(CacheStore, _NetworkStore);

  function CacheStore(collection) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, CacheStore);

    var _this = _possibleConstructorReturn(this, (CacheStore.__proto__ || Object.getPrototypeOf(CacheStore)).call(this, collection, options));

    _this.ttl = options.ttl || undefined;

    _this.syncManager = new _sync2.default(_this.collection, options);
    return _this;
  }

  _createClass(CacheStore, [{
    key: 'find',
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({ syncAutomatically: this.syncAutomatically }, options);
      var syncAutomatically = options.syncAutomatically === true;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if (query && !(query instanceof _query4.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var request = new _request.CacheRequest({
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

        return request.execute().then(function (response) {
          return response.data;
        }).catch(function () {
          return [];
        }).then(function () {
          var cacheEntities = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          observer.next(cacheEntities);

          if (syncAutomatically === true) {
            return _this2.pendingSyncCount(null, options).then(function (syncCount) {
              if (syncCount > 0) {
                return _this2.push(null, options).then(function () {
                  return _this2.pendingSyncCount(null, options);
                });
              }

              return syncCount;
            }).then(function (syncCount) {
              if (syncCount > 0) {
                throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');
              }

              return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'find', _this2).call(_this2, query, options).toPromise();
            }).then(function (networkEntities) {
              var removedEntities = (0, _differenceBy2.default)(cacheEntities, networkEntities, '_id');
              var removedIds = Object.keys((0, _keyBy2.default)(removedEntities, '_id'));
              var removeQuery = new _query4.default().contains('_id', removedIds);
              return _this2.clear(removeQuery, options).then(function () {
                return networkEntities;
              });
            }).then(function (networkEntities) {
              var request = new _request.CacheRequest({
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
              return request.execute().then(function (response) {
                return response.data;
              });
            });
          }

          return cacheEntities;
        }).then(function (entities) {
          return observer.next(entities);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream;
    }
  }, {
    key: 'findById',
    value: function findById(id) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({ syncAutomatically: this.syncAutomatically }, options);
      var syncAutomatically = options.syncAutomatically === true;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!id) {
          observer.next(undefined);
          return observer.complete();
        }

        var request = new _request.CacheRequest({
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
        return request.execute().then(function (response) {
          return response.data;
        }).catch(function () {
          return undefined;
        }).then(function (cacheEntity) {
          observer.next(cacheEntity);

          if (syncAutomatically === true) {
            return _this3.pendingSyncCount(null, options).then(function (syncCount) {
              if (syncCount > 0) {
                return _this3.push(null, options).then(function () {
                  return _this3.pendingSyncCount(null, options);
                });
              }

              return syncCount;
            }).then(function (syncCount) {
              if (syncCount > 0) {
                throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');
              }
            }).then(function () {
              return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'findById', _this3).call(_this3, id, options).toPromise();
            }).then(function (networkEntity) {
              var request = new _request.CacheRequest({
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
              return request.execute().then(function (response) {
                return response.data;
              });
            });
          }

          return cacheEntity;
        }).then(function (entity) {
          return observer.next(entity);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({ syncAutomatically: this.syncAutomatically }, options);
      var syncAutomatically = options.syncAutomatically === true;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!(aggregation instanceof _aggregation2.default)) {
          return observer.error(new _errors.KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this4.client.protocol,
            host: _this4.client.host,
            pathname: _this4.pathname + '/_group'
          }),
          properties: options.properties,
          aggregation: aggregation,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).catch(function () {
          return [];
        }).then(function () {
          var cacheResult = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          observer.next(cacheResult);

          if (syncAutomatically === true) {
            return _this4.pendingSyncCount(null, options).then(function (syncCount) {
              if (syncCount > 0) {
                return _this4.push(null, options).then(function () {
                  return _this4.pendingSyncCount(null, options);
                });
              }

              return syncCount;
            }).then(function (syncCount) {
              if (syncCount > 0) {
                throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');
              }

              return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'group', _this4).call(_this4, aggregation, options).toPromise();
            });
          }

          return cacheResult;
        }).then(function (result) {
          return observer.next(result);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });
      return stream;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({ syncAutomatically: this.syncAutomatically }, options);
      var syncAutomatically = options.syncAutomatically === true;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if (query && !(query instanceof _query4.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this5.client.protocol,
            host: _this5.client.host,
            pathname: _this5.pathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).catch(function () {
          return [];
        }).then(function () {
          var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
          return data.length;
        }).then(function (cacheCount) {
          observer.next(cacheCount);

          if (syncAutomatically === true) {
            return _this5.pendingSyncCount(null, options).then(function (syncCount) {
              if (syncCount > 0) {
                return _this5.push(null, options).then(function () {
                  return _this5.pendingSyncCount(null, options);
                });
              }

              return syncCount;
            }).then(function (syncCount) {
              if (syncCount > 0) {
                throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');
              }
            }).then(function () {
              return _get(CacheStore.prototype.__proto__ || Object.getPrototypeOf(CacheStore.prototype), 'count', _this5).call(_this5, query, options).toPromise();
            });
          }

          return cacheCount;
        }).then(function (count) {
          return observer.next(count);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream;
    }
  }, {
    key: 'create',
    value: function create(data) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!data) {
          observer.next(null);
          observer.complete();
        }

        var singular = false;

        if (!(0, _isArray2.default)(data)) {
          singular = true;
          data = [data];
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.POST,
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

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return _this6.syncManager.addCreateOperation(data, options).then(function () {
            return data;
          });
        }).then(function (data) {
          if (_this6.syncAutomatically === true) {
            var ids = Object.keys((0, _keyBy2.default)(data, '_id'));
            var query = new _query4.default().contains('entityId', ids);
            return _this6.push(query, options).then(function (results) {
              return (0, _map2.default)(results, function (result) {
                return result.entity;
              });
            });
          }

          return data;
        }).then(function (entities) {
          return observer.next(singular ? entities[0] : entities);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream.toPromise();
    }
  }, {
    key: 'update',
    value: function update(data) {
      var _this7 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!data) {
          observer.next(null);
          return observer.complete();
        }

        var singular = false;

        if (!(0, _isArray2.default)(data)) {
          singular = true;
          data = [data];
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.PUT,
          url: _url2.default.format({
            protocol: _this7.client.protocol,
            host: _this7.client.host,
            pathname: _this7.pathname,
            query: options.query
          }),
          properties: options.properties,
          body: data,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return _this7.syncManager.addUpdateOperation(data, options).then(function () {
            return data;
          });
        }).then(function (data) {
          if (_this7.syncAutomatically === true) {
            var ids = Object.keys((0, _keyBy2.default)(data, '_id'));
            var query = new _query4.default().contains('entityId', ids);
            return _this7.push(query, options).then(function (results) {
              return (0, _map2.default)(results, function (result) {
                return result.entity;
              });
            });
          }

          return data;
        }).then(function (entities) {
          return observer.next(singular ? entities[0] : entities);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream.toPromise();
    }
  }, {
    key: 'remove',
    value: function remove(query) {
      var _this8 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (query && !(query instanceof _query4.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var fetchRequest = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
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

        return fetchRequest.execute().then(function (response) {
          return response.data;
        }).then(function (entities) {
          var removeRequest = new _request.CacheRequest({
            method: _request.RequestMethod.DELETE,
            url: _url2.default.format({
              protocol: _this8.client.protocol,
              host: _this8.client.host,
              pathname: _this8.pathname,
              query: options.query
            }),
            properties: options.properties,
            body: entities,
            timeout: options.timeout
          });

          return removeRequest.execute().then(function (response) {
            return response.data;
          });
        }).then(function (entities) {
          if (entities && entities.length > 0) {
            var _ret = function () {
              var localEntities = (0, _filter2.default)(entities, function (entity) {
                var metadata = new _entity.Metadata(entity);
                return metadata.isLocal();
              });
              var query = new _query4.default().contains('entityId', Object.keys((0, _keyBy2.default)(localEntities, '_id')));
              return {
                v: _this8.clearSync(query, options).then(function () {
                  var syncEntities = (0, _xorWith2.default)(entities, localEntities, function (entity, localEntity) {
                    return entity._id === localEntity._id;
                  });
                  return _this8.syncManager.addDeleteOperation(syncEntities, options);
                }).then(function () {
                  return entities;
                })
              };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
          }

          return entities;
        }).then(function (entities) {
          if (_this8.syncAutomatically === true) {
            var ids = Object.keys((0, _keyBy2.default)(entities, '_id'));
            var _query = new _query4.default().contains('entityId', ids);
            return _this8.push(_query, options).then(function () {
              return entities;
            });
          }

          return entities;
        }).then(function (entities) {
          return observer.next(entities);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream.toPromise();
    }
  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this9 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        var request = new _request.CacheRequest({
          method: _request.RequestMethod.DELETE,
          url: _url2.default.format({
            protocol: _this9.client.protocol,
            host: _this9.client.host,
            pathname: _this9.pathname + '/' + id,
            query: options.query
          }),
          properties: options.properties,
          authType: _request.AuthType.Default,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (entity) {
          if (entity) {
            var metadata = new _entity.Metadata(entity);

            if (metadata.isLocal()) {
              var query = new _query4.default();
              query.equalTo('entityId', entity._id);
              return _this9.clearSync(query, options).then(function () {
                return entity;
              });
            }

            return _this9.syncManager.addDeleteOperation(entity, options).then(function () {
              return entity;
            });
          }

          return entity;
        }).then(function (entity) {
          if (_this9.syncAutomatically === true) {
            var query = new _query4.default().equalTo('entityId', entity._id);
            return _this9.push(query, options).then(function () {
              return entity;
            });
          }

          return entity;
        }).then(function (entity) {
          return observer.next(entity);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream.toPromise();
    }
  }, {
    key: 'clear',
    value: function clear(query) {
      var _this10 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (query && !(query instanceof _query4.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var request = new _request.CacheRequest({
          method: _request.RequestMethod.GET,
          url: _url2.default.format({
            protocol: _this10.client.protocol,
            host: _this10.client.host,
            pathname: _this10.pathname,
            query: options.query
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (entities) {
          var request = new _request.CacheRequest({
            method: _request.RequestMethod.DELETE,
            url: _url2.default.format({
              protocol: _this10.client.protocol,
              host: _this10.client.host,
              pathname: _this10.pathname,
              query: options.query
            }),
            properties: options.properties,
            body: entities,
            timeout: options.timeout
          });

          return request.execute().then(function (response) {
            return response.data;
          });
        }).then(function (entities) {
          if (entities && entities.length > 0) {
            var _query2 = new _query4.default().contains('entityId', Object.keys((0, _keyBy2.default)(entities, '_id')));
            return _this10.clearSync(_query2, options).then(function () {
              return entities;
            });
          }

          return entities;
        }).then(function (entities) {
          return observer.next(entities);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream.toPromise();
    }
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
  }, {
    key: 'push',
    value: function push(query, options) {
      return this.syncManager.push(query, options);
    }
  }, {
    key: 'pull',
    value: function pull(query) {
      var _this11 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({ useDeltaFetch: this.useDeltaFetch }, options);
      return this.syncManager.pull(query, options).then(function (entities) {
        return _this11.clear(query, options).then(function () {
          var saveRequest = new _request.CacheRequest({
            method: _request.RequestMethod.PUT,
            url: _url2.default.format({
              protocol: _this11.client.protocol,
              host: _this11.client.host,
              pathname: _this11.pathname,
              query: options.query
            }),
            properties: options.properties,
            body: entities,
            timeout: options.timeout
          });
          return saveRequest.execute();
        }).then(function () {
          return entities;
        });
      });
    }
  }, {
    key: 'sync',
    value: function sync(query, options) {
      options = (0, _assign2.default)({ useDeltaFetch: this.useDeltaFetch }, options);
      return this.syncManager.sync(query, options);
    }
  }, {
    key: 'clearSync',
    value: function clearSync(query, options) {
      return this.syncManager.clear(query, options);
    }
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
}(_networkstore2.default);

exports.default = CacheStore;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _networkstore = require('./networkstore');

var _enums = require('../enums');

var _errors = require('../errors');

var _local = require('../requests/local');

var _deltafetch = require('../requests/deltafetch');

var _query = require('../query');

var _aggregation = require('../aggregation');

var _log = require('../log');

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The CacheStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network using a cache on the device.
 */

var CacheStore = function (_NetworkStore) {
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

    // Enable sync
    _this.enableSync();
    return _this;
  }

  _createClass(CacheStore, [{
    key: 'disableSync',
    value: function disableSync() {
      this._syncEnabled = false;
    }
  }, {
    key: 'enableSync',
    value: function enableSync() {
      this._syncEnabled = true;
    }
  }, {
    key: 'isSyncEnabled',
    value: function isSyncEnabled() {
      return !!this._syncEnabled;
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
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log.Log.debug('Retrieving the entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        useDeltaFetch: true
      }, options);

      if (query && !(query instanceof _query.Query)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
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
        return request.execute();
      }).then(function (cacheResponse) {
        var result = {
          cache: cacheResponse.data
        };

        result.networkPromise = _this2.syncCount().then(function (count) {
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
            var request = new _deltafetch.DeltaFetchRequest({
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
            return request.execute().then(function (response) {
              return response.data;
            });
          }

          return _get(Object.getPrototypeOf(CacheStore.prototype), 'find', _this2).call(_this2, query, options);
        }).then(function (networkEntities) {
          var removedEntities = (0, _differenceBy2.default)(cacheResponse.data, networkEntities, idAttribute);
          var removeEntityIds = Object.keys((0, _keyBy2.default)(removedEntities, idAttribute));
          var removeQuery = new _query.Query();
          removeQuery.contains(idAttribute, removeEntityIds);

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

        return result;
      });

      promise.then(function (response) {
        _log.Log.info('Retrieved the entities in the ' + _this2.name + ' collection.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to retrieve the entities in the ' + _this2.name + ' collection.', err);
      });

      return promise;
    }

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
    value: function group(aggregation) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log.Log.debug('Grouping the entities in the ' + this.name + ' collection.', aggregation, options);

      options = (0, _assign2.default)({
        force: false
      }, options);

      if (!(aggregation instanceof _aggregation.Aggregation)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid aggregation. ' + 'It must be an instance of the Kinvey.Aggregation class.'));
      }

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
          url: _url2.default.format({
            protocol: _this3.client.protocol,
            host: _this3.client.host,
            pathname: _this3._pathname + '/_group'
          }),
          properties: options.properties,
          data: aggregation.toJSON(),
          timeout: options.timeout,
          client: _this3.client
        });
        return request.execute();
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.networkPromise = _this3.syncCount().then(function (count) {
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

        return result;
      });

      promise.then(function (response) {
        _log.Log.info('Grouped the entities in the ' + _this3.name + ' collection.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to group the entities in the ' + _this3.name + ' collection.', err);
      });

      return promise;
    }

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
    value: function count(query) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log.Log.debug('Counting the number of entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        force: false
      }, options);

      if (query && !(query instanceof _query.Query)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
          url: _url2.default.format({
            protocol: _this4.client.protocol,
            host: _this4.client.host,
            pathname: _this4._pathname + '/_count'
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: _this4.client
        });
        return request.execute();
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.networkPromise = _this4.syncCount().then(function (count) {
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

        return result;
      });

      promise.then(function (response) {
        _log.Log.info('Counted the number of entities in the ' + _this4.name + ' collection.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to count the number of entities in the ' + _this4.name + ' collection.', err);
      });

      return promise;
    }

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
    value: function findById(id) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!id) {
        _log.Log.warn('No id was provided to retrieve an entity.', id);
        return _babybird2.default.resolve(null);
      }

      _log.Log.debug('Retrieving the entity in the ' + this.name + ' collection with id = ' + id + '.');

      options = (0, _assign2.default)({
        force: false,
        useDeltaFetch: true
      }, options);

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
          url: _url2.default.format({
            protocol: _this5.client.protocol,
            host: _this5.client.host,
            pathname: _this5._pathname + '/' + id
          }),
          properties: options.properties,
          timeout: options.timeout,
          client: _this5.client
        });
        return request.execute();
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.networkPromise = _this5.syncCount().then(function (count) {
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
            var request = new _deltafetch.DeltaFetchRequest({
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
            return request.execute().then(function (response) {
              return response.data;
            });
          }

          return _get(Object.getPrototypeOf(CacheStore.prototype), 'findById', _this5).call(_this5, id, options);
        }).then(function (data) {
          return _this5._cache(data);
        }).catch(function (error) {
          if (error instanceof _errors.NotFoundError) {
            var request = new _local.LocalRequest({
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
            return request.execute().then(function () {
              throw error;
            });
          }

          throw error;
        });

        return result;
      });

      promise.then(function (response) {
        _log.Log.info('Retrieved the entity in the ' + _this5.name + ' collection with id = ' + id + '.', response);
      }).catch(function (error) {
        _log.Log.error('Failed to retrieve the entity in the ' + _this5.name + ' collection with id = ' + id + '.', error);
      });

      return promise;
    }

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
    value: function save(entity) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!entity) {
        _log.Log.warn('No entity was provided to be saved.', entity);
        return _babybird2.default.resolve(null);
      }

      _log.Log.debug('Saving the entity(s) to the ' + this.name + ' collection.', entity);

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.POST,
          url: _url2.default.format({
            protocol: _this6.client.protocol,
            host: _this6.client.host,
            pathname: _this6._pathname
          }),
          properties: options.properties,
          data: entity,
          timeout: options.timeout,
          client: _this6.client
        });

        if (entity[idAttribute]) {
          request.method = _enums.HttpMethod.PUT;
          request.url = _url2.default.format({
            protocol: _this6.client.protocol,
            host: _this6.client.host,
            pathname: _this6._pathname + '/' + entity[idAttribute]
          });
        }

        return request.execute();
      }).then(function (response) {
        var promise = _this6._sync(response.data, options).then(function () {
          var data = (0, _isArray2.default)(response.data) ? response.data : [response.data];
          var ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
          var query = new _query.Query().contains(idAttribute, ids);
          return _this6.push(query, options);
        }).then(function (pushResult) {
          var success = pushResult.success;
          var entities = (0, _map2.default)(success, function (successItem) {
            return successItem.entity;
          });
          return !(0, _isArray2.default)(entity) && entities.length === 1 ? entities[0] : entities;
        });
        return promise;
      });

      promise.then(function (response) {
        _log.Log.info('Saved the entity(s) to the ' + _this6.name + ' collection.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to save the entity(s) to the ' + _this6.name + ' collection.', err);
      });

      return promise;
    }

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
    value: function remove(query) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log.Log.debug('Removing the entities in the ' + this.name + ' collection.', query);

      if (query && !(query instanceof _query.Query)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.DELETE,
          url: _url2.default.format({
            protocol: _this7.client.protocol,
            host: _this7.client.host,
            pathname: _this7._pathname
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: _this7.client
        });
        return request.execute();
      }).then(function (response) {
        var promise = _this7._sync(response.data.entities, options).then(function () {
          var query = new _query.Query().contains(idAttribute, []);
          return _this7.push(query, options);
        }).then(function () {
          return response.data;
        });
        return promise;
      });

      promise.then(function (response) {
        _log.Log.info('Removed the entities in the ' + _this7.name + ' collection.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to remove the entities in the ' + _this7.name + ' collection.', err);
      });

      return promise;
    }

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
    value: function removeById(id) {
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!id) {
        _log.Log.warn('No id was provided to be removed.', id);
        return _babybird2.default.resolve(null);
      }

      _log.Log.debug('Removing an entity in the ' + this.name + ' collection with id = ' + id + '.');

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.DELETE,
          url: _url2.default.format({
            protocol: _this8.client.protocol,
            host: _this8.client.host,
            pathname: _this8._pathname + '/' + id
          }),
          properties: options.properties,
          authType: _enums.AuthType.Default,
          timeout: options.timeout,
          client: _this8.client
        });
        return request.execute();
      }).then(function (response) {
        var promise = _this8._sync(response.data.entities, options).then(function () {
          var query = new _query.Query().contains(idAttribute, [id]);
          return _this8.push(query, options);
        }).then(function () {
          return response.data;
        });
        return promise;
      });

      promise.then(function (response) {
        _log.Log.info('Removed the entity in the ' + _this8.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to remove the entity in the ' + _this8.name + ' collection with id = ' + id + '.', err);
      });

      return promise;
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
    value: function push(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!this.isSyncEnabled()) {
        return _babybird2.default.reject(new _errors.KinveyError('Sync is disabled.'));
      }

      if (!(query instanceof _query.Query)) {
        query = new _query.Query((0, _result2.default)(query, 'toJSON', query));
      }

      query.contains(idAttribute, [this.name]);
      return this.client.syncManager.execute(query, options);
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
    value: function pull(query) {
      var _this9 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncCount(null, options).then(function (count) {
        if (count > 0) {
          throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');
        }

        return _this9.find(query, options);
      }).then(function (result) {
        return result.networkPromise;
      });
      return promise;
    }

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
    value: function sync(query) {
      var _this10 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.push(null, options).then(function (pushResponse) {
        var promise = _this10.pull(query, options).then(function (pullResponse) {
          var result = {
            push: pushResponse,
            pull: pullResponse
          };
          return result;
        });
        return promise;
      });
      return promise;
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

      query.contains(idAttribute, [this.name]);
      return this.client.syncManager.count(query, options);
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

      var request = new _local.LocalRequest({
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
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
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
    value: function _sync(entities) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!this.isSyncEnabled()) {
        return _babybird2.default.resolve(null);
      }

      return this.client.syncManager.notify(this.name, entities, options);
    }
  }]);

  return CacheStore;
}(_networkstore.NetworkStore);

exports.CacheStore = CacheStore;
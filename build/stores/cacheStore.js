'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheStore = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _networkstore = require('./networkstore');

var _response = require('../requests/response');

var _enums = require('../enums');

var _errors = require('../errors');

var _local = require('../requests/local');

var _network = require('../requests/network');

var _deltafetch = require('../requests/deltafetch');

var _query = require('../query');

var _aggregation = require('../aggregation');

var _log = require('../log');

var _object = require('../utils/object');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

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
    return _this;
  }

  /**
   * The sync pathname for the store.
   *
   * @param   {Client}   [client]     Client
   * @return  {string}                Sync pathname
   */


  _createClass(CacheStore, [{
    key: 'find',


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
        }).then(function () {
          return response.data;
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
      var _this9 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (query && !(query instanceof _query.Query)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = _babybird2.default.resolve().then(function () {
        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.GET,
          url: _url2.default.format({
            protocol: _this9.client.protocol,
            host: _this9.client.host,
            pathname: _this9._syncPathname
          }),
          properties: options.properties,
          query: query,
          timeout: options.timeout,
          client: _this9.client
        });
        return request.execute();
      }).then(function (response) {
        var save = [];
        var remove = [];
        var entities = response.data.entities;
        var ids = Object.keys(entities);
        var size = response.data.size;

        var promises = (0, _map2.default)(ids, function (id) {
          var metadata = entities[id];
          var request = new _local.LocalRequest({
            method: _enums.HttpMethod.GET,
            url: _url2.default.format({
              protocol: _this9.client.protocol,
              host: _this9.client.host,
              pathname: _this9._pathname + '/' + id
            }),
            properties: metadata.properties,
            timeout: options.timeout,
            client: _this9.client
          });
          return request.execute().then(function (response) {
            save.push(response.data);
            return response.data;
          }).catch(function (err) {
            if (err instanceof _errors.NotFoundError) {
              remove.push(id);
              return null;
            }

            throw err;
          });
        });

        return _babybird2.default.all(promises).then(function () {
          var saved = (0, _map2.default)(save, function (entity) {
            var metadata = entities[entity[idAttribute]];
            var isLocalEntity = (0, _object.nested)(entity, kmdAttribute + '.local');

            if (isLocalEntity) {
              var _ret = function () {
                var originalId = entity[idAttribute];
                delete entity[idAttribute];
                delete entity[kmdAttribute];

                var request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.POST,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: _this9.client.protocol,
                    host: _this9.client.host,
                    pathname: _this9._pathname
                  }),
                  properties: metadata.properties,
                  data: entity,
                  timeout: options.timeout,
                  client: _this9.client
                });

                return {
                  v: request.execute().then(function (response) {
                    var request = new _local.LocalRequest({
                      method: _enums.HttpMethod.PUT,
                      url: _url2.default.format({
                        protocol: _this9.client.protocol,
                        host: _this9.client.host,
                        pathname: _this9._pathname
                      }),
                      properties: metadata.properties,
                      data: response.data,
                      timeout: options.timeout,
                      client: _this9.client
                    });
                    return request.execute();
                  }).then(function () {
                    var request = new _local.LocalRequest({
                      method: _enums.HttpMethod.DELETE,
                      url: _url2.default.format({
                        protocol: _this9.client.protocol,
                        host: _this9.client.host,
                        pathname: _this9._pathname + '/' + originalId
                      }),
                      properties: metadata.properties,
                      timeout: options.timeout,
                      client: _this9.client
                    });

                    return request.execute().then(function (response) {
                      var result = response.data;
                      if (result.count === 1) {
                        size = size - 1;
                        delete entities[originalId];
                        return {
                          _id: originalId,
                          entity: entity
                        };
                      }

                      return {
                        _id: originalId,
                        error: new _errors.KinveyError('Expected count to be 1 but instead it was ' + result.count + ' ' + ('when trying to remove entity with _id ' + originalId + '.'))
                      };
                    });
                  }).catch(function (error) {
                    var result = { _id: originalId, error: error };
                    return result;
                  })
                };
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            var request = new _network.NetworkRequest({
              method: _enums.HttpMethod.PUT,
              authType: _enums.AuthType.Default,
              url: _url2.default.format({
                protocol: _this9.client.protocol,
                host: _this9.client.host,
                pathname: _this9._pathname + '/' + entity[idAttribute]
              }),
              properties: metadata.properties,
              data: entity,
              timeout: options.timeout,
              client: _this9.client
            });

            return request.execute().then(function (response) {
              size = size - 1;
              delete entities[response.data[idAttribute]];
              return {
                _id: response.data[idAttribute],
                entity: response.data
              };
            }).catch(function (err) {
              // If the credentials used to authenticate this request are
              // not authorized to run the operation then just remove the entity
              // from the sync table
              if (err instanceof _errors.InsufficientCredentialsError) {
                size = size - 1;
                delete entities[entity[idAttribute]];
                return {
                  _id: entity[idAttribute],
                  error: err
                };
              }

              return {
                _id: entity[idAttribute],
                error: err
              };
            });
          });

          var removed = (0, _map2.default)(remove, function (id) {
            var metadata = entities[id];
            var request = new _network.NetworkRequest({
              method: _enums.HttpMethod.DELETE,
              authType: _enums.AuthType.Default,
              url: _url2.default.format({
                protocol: _this9.client.protocol,
                host: _this9.client.host,
                pathname: _this9._pathname + '/' + id
              }),
              properties: metadata.properties,
              timeout: options.timeout,
              client: _this9.client
            });

            return request.execute().then(function (response) {
              var result = response.data;

              if (result.count === 1) {
                size = size - 1;
                delete entities[id];
                return {
                  _id: id
                };
              }

              return {
                _id: id,
                error: new _errors.KinveyError('Expected count to be 1 but instead it was ' + result.count + ' ' + ('when trying to remove entity with _id ' + id + '.'))
              };
            }).catch(function (err) {
              // If the credentials used to authenticate this request are
              // not authorized to run the operation or the entity was
              // not found then just remove the entity from the sync table
              if (err instanceof _errors.NotFoundError || err instanceof _errors.InsufficientCredentialsError) {
                size = size - 1;
                delete entities[id];
                return {
                  _id: id,
                  error: err
                };
              }

              return {
                _id: id,
                error: err
              };
            });
          });

          return _babybird2.default.all([_babybird2.default.all(saved), _babybird2.default.all(removed)]);
        }).then(function (results) {
          var savedResults = results[0];
          var removedResults = results[1];
          var result = {
            collection: _this9.name,
            success: [],
            error: []
          };

          (0, _forEach2.default)(savedResults, function (savedResult) {
            if (savedResult.error) {
              result.error.push(savedResult);
            } else {
              result.success.push(savedResult);
            }
          });

          (0, _forEach2.default)(removedResults, function (removedResult) {
            if (removedResult.error) {
              result.error.push(removedResult);
            } else {
              result.success.push(removedResult);
            }
          });

          return result;
        }).then(function (result) {
          response.data.size = size;
          response.data.entities = entities;

          var request = new _local.LocalRequest({
            method: _enums.HttpMethod.PUT,
            url: _url2.default.format({
              protocol: _this9.client.protocol,
              host: _this9.client.host,
              pathname: _this9._syncPathname
            }),
            properties: options.properties,
            data: response.data,
            timeout: options.timeout,
            client: _this9.client
          });
          return request.execute().then(function () {
            return result;
          });
        });
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return {
            collection: _this9.name,
            success: [],
            error: []
          };
        }

        throw err;
      });

      return promise;
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
      var _this10 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncCount(null, options).then(function (count) {
        if (count > 0) {
          throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');
        }

        return _this10.find(query, options);
      }).then(function (result) {
        return result.network;
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
      var _this11 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.push(null, options).then(function (pushResponse) {
        var promise = _this11.pull(query, options).then(function (pullResponse) {
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

      if (query && !(query instanceof _query.Query)) {
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var request = new _local.LocalRequest({
        method: _enums.HttpMethod.GET,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._syncPathname
        }),
        properties: options.properties,
        query: query,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data.size || 0;
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return 0;
        }

        throw err;
      });

      return promise;
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
      var _this12 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!this.name) {
        return _babybird2.default.reject(new _errors.KinveyError('Unable to add entities to the sync table for a store with no name.'));
      }

      if (!entities) {
        return _babybird2.default.resolve(null);
      }

      var request = new _local.LocalRequest({
        method: _enums.HttpMethod.GET,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._syncPathname
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().catch(function (error) {
        if (error instanceof _errors.NotFoundError) {
          return new _response.Response({
            statusCode: _enums.StatusCode.Ok,
            data: {
              _id: _this12.name,
              entities: {},
              size: 0
            }
          });
        }

        throw error;
      }).then(function (response) {
        var syncData = response.data || {
          _id: _this12.name,
          entities: {},
          size: 0
        };

        if (!(0, _isArray2.default)(entities)) {
          entities = [entities];
        }

        (0, _forEach2.default)(entities, function (entity) {
          if (entity[idAttribute]) {
            if (!syncData.entities.hasOwnProperty(entity[idAttribute])) {
              syncData.size = syncData.size + 1;
            }

            syncData.entities[entity[idAttribute]] = {
              lmt: entity[kmdAttribute] ? entity[kmdAttribute].lmt : null
            };
          }
        });

        var request = new _local.LocalRequest({
          method: _enums.HttpMethod.PUT,
          url: _url2.default.format({
            protocol: _this12.client.protocol,
            host: _this12.client.host,
            pathname: _this12._syncPathname
          }),
          properties: options.properties,
          data: syncData,
          timeout: options.timeout,
          client: _this12.client
        });
        return request.execute();
      }).then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: '_syncPathname',
    get: function get() {
      if (!this.name) {
        throw new Error('Unable to get a sync pathname for a collection with no name.');
      }

      return '/' + appdataNamespace + '/' + this.client.appKey + '/' + syncCollectionName + '/' + this.name;
    }
  }]);

  return CacheStore;
}(_networkstore.NetworkStore);

exports.CacheStore = CacheStore;
//# sourceMappingURL=cacheStore.js.map

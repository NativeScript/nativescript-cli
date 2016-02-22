'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _networkStore = require('./networkStore');

var _networkStore2 = _interopRequireDefault(_networkStore);

var _response = require('../requests/response');

var _response2 = _interopRequireDefault(_response);

var _enums = require('../enums');

var _errors = require('../errors');

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _aggregation = require('../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _object = require('../utils/object');

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

      _log2.default.debug('Retrieving the entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        useDeltaFetch: true
      }, options);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this2.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this2._pathname,
          properties: options.properties,
          auth: _this2.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.network = _this2.syncCount().then(function (count) {
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
            return _this2.client.executeDeltaFetchRequest({
              method: _enums.HttpMethod.GET,
              pathname: _this2._pathname,
              properties: options.properties,
              auth: _this2.client.defaultAuth(),
              query: query,
              timeout: options.timeout
            }).then(function (response) {
              return response.data;
            });
          }

          return _get(Object.getPrototypeOf(CacheStore.prototype), 'find', _this2).call(_this2, query, options);
        }).then(function (data) {
          var removedEntityIds = Object.keys((0, _keyBy2.default)(data, idAttribute));
          var removeQuery = new _query2.default();
          removeQuery.contains(idAttribute, removedEntityIds);

          return _this2.client.executeLocalRequest({
            method: _enums.HttpMethod.DELETE,
            pathname: _this2._pathname,
            properties: options.properties,
            auth: _this2.client.defaultAuth(),
            query: removeQuery,
            timeout: options.timeout
          }).then(function () {
            return _this2._updateCache(data);
          });
        });

        return result;
      });

      promise.then(function (response) {
        _log2.default.info('Retrieved the entities in the ' + _this2.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to retrieve the entities in the ' + _this2.name + ' collection.', err);
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

      _log2.default.debug('Grouping the entities in the ' + this.name + ' collection.', aggregation, options);

      options = (0, _assign2.default)({
        force: false
      }, options);

      if (!(aggregation instanceof _aggregation2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid aggregation. ' + 'It must be an instance of the Kinvey.Aggregation class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this3.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this3._pathname + '/_group',
          properties: options.properties,
          auth: _this3.client.defaultAuth(),
          data: aggregation.toJSON(),
          timeout: options.timeout
        });
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.network = _this3.syncCount().then(function (count) {
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
        _log2.default.info('Grouped the entities in the ' + _this3.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to group the entities in the ' + _this3.name + ' collection.', err);
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

      _log2.default.debug('Counting the number of entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        force: false
      }, options);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this4.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this4._pathname + '/_count',
          properties: options.properties,
          auth: _this4.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.network = _this4.syncCount().then(function (count) {
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
        _log2.default.info('Counted the number of entities in the ' + _this4.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to count the number of entities in the ' + _this4.name + ' collection.', err);
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
        _log2.default.warn('No id was provided to retrieve an entity.', id);
        return Promise.resolve(null);
      }

      _log2.default.debug('Retrieving the entity in the ' + this.name + ' collection with id = ' + id + '.');

      options = (0, _assign2.default)({
        force: false,
        useDeltaFetch: true
      }, options);

      var promise = Promise.resolve().then(function () {
        return _this5.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this5._pathname + '/' + id,
          properties: options.properties,
          auth: _this5.client.defaultAuth(),
          timeout: options.timeout
        });
      }).then(function (response) {
        var result = {
          cache: response.data
        };

        result.network = _this5.syncCount().then(function (count) {
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
            return _this5.client.executeDeltaFetchRequest({
              method: _enums.HttpMethod.GET,
              pathname: _this5._pathname + '/' + id,
              properties: options.properties,
              auth: _this5.client.defaultAuth(),
              timeout: options.timeout
            }).then(function (response) {
              return response.data;
            });
          }

          return _get(Object.getPrototypeOf(CacheStore.prototype), 'findById', _this5).call(_this5, id, options);
        }).then(function (data) {
          return _this5._updateCache(data);
        }).catch(function (err) {
          if (err instanceof _errors.NotFoundError) {
            return _this5.client.executeLocalRequest({
              method: _enums.HttpMethod.DELETE,
              pathname: _this5._pathname + '/' + id,
              properties: options.properties,
              auth: _this5.client.defaultAuth(),
              timeout: options.timeout
            }).then(function () {
              throw err;
            });
          }

          throw err;
        });

        return result;
      });

      promise.then(function (response) {
        _log2.default.info('Retrieved the entity in the ' + _this5.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to retrieve the entity in the ' + _this5.name + ' collection with id = ' + id + '.', err);
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
        _log2.default.warn('No entity was provided to be saved.', entity);
        return Promise.resolve(null);
      }

      if (entity[idAttribute]) {
        _log2.default.warn('Entity argument contains an _id. Calling update instead.', entity);
        return this.update(entity, options);
      }

      _log2.default.debug('Saving the entity(s) to the ' + this.name + ' collection.', entity);

      var promise = Promise.resolve().then(function () {
        return _this6.client.executeLocalRequest({
          method: _enums.HttpMethod.POST,
          pathname: _this6._pathname,
          properties: options.properties,
          auth: _this6.client.defaultAuth(),
          data: entity,
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this6._updateSync(response.data, options).then(function () {
          var data = (0, _isArray2.default)(response.data) ? response.data : [response.data];
          var ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
          var query = new _query2.default().contains(idAttribute, ids);
          return _this6.push(query, options);
        }).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log2.default.info('Saved the entity(s) to the ' + _this6.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to save the entity(s) to the ' + _this6.name + ' collection.', err);
      });

      return promise;
    }

    /**
     * Updates a entity or an array of entities in a collection. A promise will be returned that
     * will be resolved with the updated entity/entities or rejected with an error.
     *
     * @param   {Object|Array}          entities                                  Entity or entities to update.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Number}                [options.ttl]                             Time to live for data updated
     *                                                                            in the cache.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'update',
    value: function update(entity) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!entity) {
        _log2.default.warn('No entity was provided to be updated.', entity);
        return Promise.resolve(null);
      }

      if (!entity[idAttribute]) {
        _log2.default.warn('Entity argument does not contain an _id. Calling save instead.', entity);
        return this.save(entity, options);
      }

      _log2.default.debug('Updating the entity(s) in the ' + this.name + ' collection.', entity);

      var promise = Promise.resolve().then(function () {
        return _this7.client.executeLocalRequest({
          method: _enums.HttpMethod.PUT,
          pathname: _this7._pathname + '/' + entity[idAttribute],
          properties: options.properties,
          auth: _this7.client.defaultAuth(),
          data: entity,
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this7._updateSync(response.data, options).then(function () {
          var data = (0, _isArray2.default)(response.data) ? response.data : [response.data];
          var ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
          var query = new _query2.default().contains(idAttribute, ids);
          return _this7.push(query, options);
        }).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log2.default.info('Updated the entity(s) in the ' + _this7.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to update the entity(s) in the ' + _this7.name + ' collection.', err);
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
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log2.default.debug('Removing the entities in the ' + this.name + ' collection.', query);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this8.client.executeLocalRequest({
          method: _enums.HttpMethod.DELETE,
          pathname: _this8._pathname,
          properties: options.properties,
          auth: _this8.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this8._updateSync(response.data.entities, options).then(function () {
          var query = new _query2.default().contains(idAttribute, []);
          return _this8.push(query, options);
        }).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log2.default.info('Removed the entities in the ' + _this8.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to remove the entities in the ' + _this8.name + ' collection.', err);
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
      var _this9 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!id) {
        _log2.default.warn('No id was provided to be removed.', id);
        return Promise.resolve(null);
      }

      _log2.default.debug('Removing an entity in the ' + this.name + ' collection with id = ' + id + '.');

      var promise = Promise.resolve().then(function () {
        return _this9.client.executeLocalRequest({
          method: _enums.HttpMethod.DELETE,
          pathname: _this9._pathname + '/' + id,
          properties: options.properties,
          auth: _this9.client.defaultAuth(),
          timeout: options.timeout
        });
      }).then(function (response) {
        return _this9._updateSync(response.data.entities, options).then(function () {
          var query = new _query2.default().contains(idAttribute, [id]);
          return _this9.push(query, options);
        }).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log2.default.info('Removed the entity in the ' + _this9.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to remove the entity in the ' + _this9.name + ' collection with id = ' + id + '.', err);
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
      var _this10 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this10.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this10._syncPathname,
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        var save = [];
        var remove = [];
        var entities = response.data.entities;
        var ids = Object.keys(entities);
        var size = response.data.size;

        var promises = (0, _map2.default)(ids, function (id) {
          var metadata = (0, _clone2.default)(entities[id], true);
          return _this10.client.executeLocalRequest({
            method: _enums.HttpMethod.GET,
            pathname: _this10._pathname + '/' + id,
            properties: metadata.properties,
            auth: _this10.client.defaultAuth(),
            timeout: options.timeout
          }).then(function (response) {
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

        return Promise.all(promises).then(function () {
          var saved = (0, _map2.default)(save, function (entity) {
            var metadata = (0, _clone2.default)(entities[entity[idAttribute]], true);
            var isLocalEntity = (0, _object.nested)(entity, kmdAttribute + '.local');

            if (isLocalEntity) {
              var _ret = function () {
                var originalId = entity[idAttribute];
                delete entity[idAttribute];
                delete entity[kmdAttribute];

                return {
                  v: _this10.client.executeNetworkRequest({
                    method: _enums.HttpMethod.POST,
                    pathname: _this10._pathname,
                    properties: metadata.properties,
                    auth: _this10.client.defaultAuth(),
                    data: entity,
                    timeout: options.timeout
                  }).then(function (response) {
                    return _this10.client.executeLocalRequest({
                      method: _enums.HttpMethod.PUT,
                      pathname: _this10._pathname,
                      properties: metadata.properties,
                      data: response.data,
                      timeout: options.timeout
                    });
                  }).then(function () {
                    return _this10.client.executeLocalRequest({
                      method: _enums.HttpMethod.DELETE,
                      pathname: _this10._pathname + '/' + originalId,
                      properties: metadata.properties,
                      auth: _this10.client.defaultAuth(),
                      timeout: options.timeout
                    }).then(function (response) {
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
                  }).catch(function (err) {
                    return {
                      _id: originalId,
                      error: err
                    };
                  })
                };
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            return _this10.client.executeNetworkRequest({
              method: _enums.HttpMethod.PUT,
              pathname: _this10._pathname + '/' + entity[idAttribute],
              properties: metadata.properties,
              auth: _this10.client.defaultAuth(),
              data: entity,
              timeout: options.timeout
            }).then(function (response) {
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
            var metadata = (0, _clone2.default)(entities[id], true);
            return _this10.client.executeNetworkRequest({
              method: _enums.HttpMethod.DELETE,
              pathname: _this10._pathname + '/' + id,
              properties: metadata.properties,
              auth: _this10.client.defaultAuth(),
              timeout: options.timeout
            }).then(function (response) {
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

          return Promise.all([Promise.all(saved), Promise.all(removed)]);
        }).then(function (results) {
          var savedResults = results[0];
          var removedResults = results[1];
          var result = {
            collection: _this10.name,
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

          return _this10.client.executeLocalRequest({
            method: _enums.HttpMethod.PUT,
            pathname: _this10._syncPathname,
            properties: options.properties,
            data: response.data,
            timeout: options.timeout
          }).then(function () {
            return result;
          });
        });
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return {
            collection: _this10.name,
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
      var _this11 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncCount(null, options).then(function (count) {
        if (count > 0) {
          throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');
        }

        return _this11.find(query, options);
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
      var _this12 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.push(null, options).then(function (pushResponse) {
        return _this12.pull(query, options).then(function (pullResponse) {
          return {
            push: pushResponse,
            pull: pullResponse
          };
        });
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
      var _this13 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this13.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this13._syncPathname,
          properties: options.properties,
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
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
    key: '_updateCache',
    value: function _updateCache(entities) {
      var _this14 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = Promise.resolve().then(function () {
        return _this14.client.executeLocalRequest({
          method: _enums.HttpMethod.PUT,
          pathname: _this14._pathname,
          properties: options.properties,
          data: entities,
          timeout: options.timeout
        });
      }).then(function (response) {
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
    key: '_updateSync',
    value: function _updateSync(entities) {
      var _this15 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!this.name) {
        return Promise.reject(new _errors.KinveyError('Unable to add entities to the sync table for a store with no name.'));
      }

      if (!entities) {
        return Promise.resolve(null);
      }

      var promise = Promise.resolve().then(function () {
        return _this15.client.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this15._syncPathname,
          properties: options.properties,
          timeout: options.timeout
        });
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return new _response2.default({
            statusCode: _enums.StatusCode.Ok,
            data: {
              _id: _this15.name,
              entities: {},
              size: 0
            }
          });
        }

        throw err;
      }).then(function (response) {
        var syncData = response.data || {
          _id: _this15.name,
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

        return _this15.client.executeLocalRequest({
          method: _enums.HttpMethod.PUT,
          pathname: _this15._syncPathname,
          properties: options.properties,
          data: syncData,
          timeout: options.timeout
        });
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
}(_networkStore2.default);

exports.default = CacheStore;
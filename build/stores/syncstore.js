'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _cachestore = require('./cachestore');

var _local = require('../requests/local');

var _aggregation = require('../aggregation');

var _enums = require('../enums');

var _errors = require('../errors');

var _query = require('../query');

var _log = require('../log');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

var SyncStore = exports.SyncStore = function (_CacheStore) {
  _inherits(SyncStore, _CacheStore);

  function SyncStore() {
    _classCallCheck(this, SyncStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SyncStore).apply(this, arguments));
  }

  _createClass(SyncStore, [{
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

      if (query && !(query instanceof _query.Query)) {
        return _bluebird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var request = new _local.LocalRequest({
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

      var promise = request.execute().then(function (response) {
        return response.data;
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

      if (!(aggregation instanceof _aggregation.Aggregation)) {
        return _bluebird2.default.reject(new _errors.KinveyError('Invalid aggregation. ' + 'It must be an instance of the Kinvey.Aggregation class.'));
      }

      var request = new _local.LocalRequest({
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

      var promise = request.execute().then(function (response) {
        return response.data;
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

      if (query && !(query instanceof _query.Query)) {
        return _bluebird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var request = new _local.LocalRequest({
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

      var promise = request.execute().then(function (response) {
        return response.data;
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
        return _bluebird2.default.resolve(null);
      }

      _log.Log.debug('Retrieving the entity in the ' + this.name + ' collection with id = ' + id + '.');

      var request = new _local.LocalRequest({
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

      var promise = request.execute().then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log.Log.info('Retrieved the entity in the ' + _this5.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to retrieve the entity in the ' + _this5.name + ' collection with id = ' + id + '.', err);
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
        return _bluebird2.default.resolve(null);
      }

      _log.Log.debug('Saving the entity(s) to the ' + this.name + ' collection.', entity);

      var request = new _local.LocalRequest({
        method: _enums.HttpMethod.POST,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname
        }),
        properties: options.properties,
        data: entity,
        timeout: options.timeout,
        client: this.client
      });

      if (entity[idAttribute]) {
        request.method = _enums.HttpMethod.PUT;
        request.url = _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname + '/' + entity[idAttribute]
        });
      }

      var promise = request.execute().then(function (response) {
        return _this6._sync(response.data, options).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log.Log.info('Saved the entity(s) to the ' + _this6.name + ' collection.', response);
      }).catch(function (error) {
        _log.Log.error('Failed to save the entity(s) to the ' + _this6.name + ' collection.', error);
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
        return _bluebird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

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

      var promise = request.execute().then(function (response) {
        return _this7._sync(response.data.entities, options).then(function () {
          return response.data;
        });
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
        return _bluebird2.default.resolve(null);
      }

      _log.Log.debug('Removing an entity in the ' + this.name + ' collection with id = ' + id + '.');

      var request = new _local.LocalRequest({
        method: _enums.HttpMethod.DELETE,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this._pathname + '/' + id
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return _this8._sync(response.data.entities, options).then(function () {
          return response.data;
        });
      });

      promise.then(function (response) {
        _log.Log.info('Removed the entity in the ' + _this8.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log.Log.error('Failed to remove the entity in the ' + _this8.name + ' collection with id = ' + id + '.', err);
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

        return _get(Object.getPrototypeOf(SyncStore.prototype), 'find', _this9).call(_this9, query, options);
      }).then(function (result) {
        return result.networkPromise;
      });
      return promise;
    }
  }]);

  return SyncStore;
}(_cachestore.CacheStore);
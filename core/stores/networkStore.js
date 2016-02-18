'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _aggregation = require('../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _enums = require('../enums');

var _errors = require('../errors');

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _query = require('../query');

var _query2 = _interopRequireDefault(_query);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The NetworkStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network.
 */

var NetworkStore = function () {
  /**
   * Creates a new instance of the NetworkStore class.
   *
   * @param   {string}  name   Name of the collection
   *
   * @throws  {KinveyError}   If the name provided is not a string.
   */

  function NetworkStore(name) {
    _classCallCheck(this, NetworkStore);

    if (name && !(0, _isString2.default)(name)) {
      throw new _errors.KinveyError('Name must be a string.');
    }

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}                Pathname
   */


  _createClass(NetworkStore, [{
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
     * @return  {Promise}                                                         Promise
     */
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log2.default.debug('Retrieving the entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        flags: null,
        handler: function handler() {}
      }, options);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this._pathname,
          properties: options.properties,
          auth: _this.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Retrieved the entities in the ' + _this.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to retrieve the entities in the ' + _this.name + ' collection.', err);
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
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'group',
    value: function group(aggregation) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log2.default.debug('Grouping the entities in the ' + this.name + ' collection.', aggregation, options);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        useDeltaFetch: true,
        handler: function handler() {}
      }, options);

      if (!(aggregation instanceof _aggregation2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid aggregation. ' + 'It must be an instance of the Kinvey.Aggregation class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this2.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this2._pathname + '/_group',
          properties: options.properties,
          auth: _this2.client.defaultAuth(),
          data: aggregation.toJSON(),
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Grouped the entities in the ' + _this2.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to group the entities in the ' + _this2.name + ' collection.', err);
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
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _log2.default.debug('Counting the number of entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        useDeltaFetch: true,
        handler: function handler() {}
      }, options);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this3.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this3._pathname + '/_count',
          properties: options.properties,
          auth: _this3.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Counted the number of entities in the ' + _this3.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to count the number of entities in the ' + _this3.name + ' collection.', err);
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
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!id) {
        _log2.default.warn('No id was provided to retrieve an entity.', id);
        return Promise.resolve(null);
      }

      _log2.default.debug('Retrieving the entity in the ' + this.name + ' collection with id = ' + id + '.');

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        handler: function handler() {}
      }, options);

      var promise = Promise.resolve().then(function () {
        return _this4.client.executeNetworkRequest({
          method: _enums.HttpMethod.GET,
          pathname: _this4._pathname + '/' + id,
          properties: options.properties,
          auth: _this4.client.defaultAuth(),
          timeout: options.timeout
        });
      }).then(function (response) {
        if (response.isSuccess()) {
          return (0, _isArray2.default)(response.data) && response.data.length === 1 ? response.data[0] : response.data;
        }

        throw response.error;
      });

      promise.then(function (response) {
        _log2.default.info('Retrieved the entity in the ' + _this4.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to retrieve the entity in the ' + _this4.name + ' collection with id = ' + id + '.', err);
      });

      return promise;
    }

    /**
     * Save a entity or an array of entities to a collection. A promise will be returned that
     * will be resolved with the saved entity/entities or rejected with an error.
     *
     * @param   {Object|Array}          doc                                       Document or entities to save.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'save',
    value: function save(entity) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!entity) {
        _log2.default.warn('No entity was provided to be saved.', entity);
        return Promise.resolve(null);
      }

      if (entity._id) {
        _log2.default.warn('Entity argument contains an _id. Calling update instead.', entity);
        return this.update(entity, options);
      }

      _log2.default.debug('Saving the entity(s) to the ' + this.name + ' collection.', entity);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        handler: function handler() {}
      }, options);

      var promise = Promise.resolve().then(function () {
        return _this5.client.executeNetworkRequest({
          method: _enums.HttpMethod.POST,
          pathname: _this5._pathname,
          properties: options.properties,
          auth: _this5.client.defaultAuth(),
          data: entity,
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Saved the entity(s) to the ' + _this5.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to save the entity(s) to the ' + _this5.name + ' collection.', err);
      });

      return promise;
    }

    /**
     * Updates a entity or an array of entities in a collection. A promise will be returned that
     * will be resolved with the updated entity/entities or rejected with an error.
     *
     * @param   {Model|Array}           entity                                    Entity or entities to update.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'update',
    value: function update(entity) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (!entity) {
        _log2.default.warn('No entity was provided to be updated.', entity);
        return Promise.resolve(null);
      }

      if (!entity._id) {
        _log2.default.warn('Entity argument does not contain an _id. Calling save instead.', entity);
        return this.save(entity, options);
      }

      _log2.default.debug('Updating the entity(s) in the ' + this.name + ' collection.', entity);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        handler: function handler() {}
      }, options);

      var promise = Promise.resolve().then(function () {
        return _this6.client.executeNetworkRequest({
          method: _enums.HttpMethod.PUT,
          pathname: _this6._pathname + '/' + entity[idAttribute],
          properties: options.properties,
          auth: _this6.client.defaultAuth(),
          data: entity,
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Updated the entity(s) in the ' + _this6.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to update the entity(s) in the ' + _this6.name + ' collection.', err);
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

      _log2.default.debug('Removing the entities in the ' + this.name + ' collection.', query);

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        handler: function handler() {}
      }, options);

      if (query && !(query instanceof _query2.default)) {
        return Promise.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
      }

      var promise = Promise.resolve().then(function () {
        return _this7.client.executeNetworkRequest({
          method: _enums.HttpMethod.DELETE,
          pathname: _this7._pathname,
          properties: options.properties,
          auth: _this7.client.defaultAuth(),
          query: query,
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Removed the entities in the ' + _this7.name + ' collection.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to remove the entities in the ' + _this7.name + ' collection.', err);
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
        _log2.default.warn('No id was provided to be removed.', id);
        return Promise.resolve(null);
      }

      _log2.default.debug('Removing an entity in the ' + this.name + ' collection with id = ' + id + '.');

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        handler: function handler() {}
      }, options);

      var promise = Promise.resolve().then(function () {
        return _this8.client.executeNetworkRequest({
          method: _enums.HttpMethod.DELETE,
          pathname: _this8._pathname + '/' + id,
          properties: options.properties,
          auth: _this8.client.defaultAuth(),
          timeout: options.timeout
        });
      }).then(function (response) {
        return response.data;
      });

      promise.then(function (response) {
        _log2.default.info('Removed the entity in the ' + _this8.name + ' collection with id = ' + id + '.', response);
      }).catch(function (err) {
        _log2.default.error('Failed to remove the entity in the ' + _this8.name + ' collection with id = ' + id + '.', err);
      });

      return promise;
    }
  }, {
    key: '_pathname',
    get: function get() {
      var pathname = '/' + appdataNamespace + '/' + this.client.appKey;

      if (this.name) {
        pathname = pathname + '/' + this.name;
      }

      return pathname;
    }
  }]);

  return NetworkStore;
}();

exports.default = NetworkStore;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _cachestore = require('./cachestore');

var _local = require('../requests/local');

var _aggregation = require('../aggregation');

var _enums = require('../enums');

var _errors = require('../errors');

var _query = require('../query');

var _log = require('../log');

var _metadata = require('../metadata');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _xorWith = require('lodash/xorWith');

var _xorWith2 = _interopRequireDefault(_xorWith);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _parallel = require('async/parallel');

var _parallel2 = _interopRequireDefault(_parallel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _babybird2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _babybird2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var idAttribute = '_id' || '_id';

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
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
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
        return _babybird2.default.reject(new _errors.KinveyError('Invalid aggregation. ' + 'It must be an instance of the Kinvey.Aggregation class.'));
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
        return _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.'));
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
        return _babybird2.default.resolve(null);
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(entities) {
        var _this6 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var singular, request;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                singular = false;

                if (entities) {
                  _context.next = 4;
                  break;
                }

                _log.Log.warn('No entity was provided to be saved.', entities);
                return _context.abrupt('return', _babybird2.default.resolve(null));

              case 4:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.POST,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname
                  }),
                  properties: options.properties,
                  body: entities,
                  timeout: options.timeout
                });


                if (entities[idAttribute]) {
                  request.method = _enums.HttpMethod.PUT;
                  request.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this._pathname + '/' + entities[idAttribute]
                  });
                }

                _context.next = 8;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 8:
                entities = _context.sent;


                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                _context.next = 12;
                return _babybird2.default.all((0, _map2.default)(entities, function (entity) {
                  return _this6.sync.save(_this6.name, entity, options);
                }));

              case 12:
                return _context.abrupt('return', singular ? entities[0] : entities);

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function save(_x5, _x6) {
        return ref.apply(this, arguments);
      }

      return save;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(query) {
        var _this7 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, entities, localEntities, syncEntities;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt('return', _babybird2.default.reject(new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.')));

              case 2:
                request = new _local.LocalRequest({
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
                _context4.next = 5;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 5:
                entities = _context4.sent;
                localEntities = (0, _filter2.default)(entities, function (entity) {
                  var metadata = new _metadata.Metadata(entity);
                  return metadata.isLocal();
                });
                syncEntities = (0, _xorWith2.default)(entities, localEntities, function (entity, localEntity) {
                  return entity[idAttribute] === localEntity[idAttribute];
                });
                return _context4.abrupt('return', new _babybird2.default(function (reject, resolve) {
                  (0, _parallel2.default)([function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(callback) {
                      var query;
                      return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              query = new _query.Query();

                              query.contains('entityId', Object.keys((0, _keyBy2.default)(localEntities, idAttribute)));
                              _context2.next = 4;
                              return _this7.sync.clear(query, options);

                            case 4:
                              callback();

                            case 5:
                            case 'end':
                              return _context2.stop();
                          }
                        }
                      }, _callee2, _this7);
                    }));

                    return function (_x11) {
                      return ref.apply(this, arguments);
                    };
                  }(), function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(callback) {
                      return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.next = 2;
                              return _this7.sync.remove(_this7.name, syncEntities, options);

                            case 2:
                              callback();

                            case 3:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this7);
                    }));

                    return function (_x12) {
                      return ref.apply(this, arguments);
                    };
                  }()], function (error) {
                    if (error) {
                      return reject(error);
                    }

                    return resolve(entities);
                  });
                }));

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function remove(_x8, _x9) {
        return ref.apply(this, arguments);
      }

      return remove;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, entity, metadata, query;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (id) {
                  _context5.next = 3;
                  break;
                }

                _log.Log.warn('No id was provided to be removed.', id);
                return _context5.abrupt('return', _babybird2.default.resolve(null));

              case 3:
                request = new _local.LocalRequest({
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
                _context5.next = 6;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 6:
                entity = _context5.sent;
                metadata = new _metadata.Metadata(entity);

                if (!metadata.isLocal()) {
                  _context5.next = 15;
                  break;
                }

                query = new _query.Query();

                query.equalTo('entityId', entity[idAttribute]);
                _context5.next = 13;
                return this.sync.clear(this.name, query, options);

              case 13:
                _context5.next = 17;
                break;

              case 15:
                _context5.next = 17;
                return this.sync.remove(this.name, entity, options);

              case 17:
                return _context5.abrupt('return', entity);

              case 18:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function removeById(_x13, _x14) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()

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
      var _this8 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncCount(null, options).then(function (count) {
        if (count > 0) {
          throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');
        }

        return _get(Object.getPrototypeOf(SyncStore.prototype), 'find', _this8).call(_this8, query, options);
      }).then(function (result) {
        return result.networkPromise;
      });
      return promise;
    }
  }]);

  return SyncStore;
}(_cachestore.CacheStore);
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout
                });
                return _context.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x, _x2) {
        return ref.apply(this, arguments);
      }

      return find;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(aggregation) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (aggregation instanceof _aggregation.Aggregation) {
                  _context2.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid aggregation. It must be an instance of the Kinvey.Aggregation class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/_group'
                  }),
                  properties: options.properties,
                  body: aggregation.toJSON(),
                  timeout: options.timeout
                });
                return _context2.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function group(_x4, _x5) {
        return ref.apply(this, arguments);
      }

      return group;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context3.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/_count'
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout
                });
                return _context3.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function count(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return count;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (id) {
                  _context4.next = 3;
                  break;
                }

                _log.Log.warn('No id was provided to retrieve an entity.', id);
                return _context4.abrupt('return', null);

              case 3:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.GET,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                return _context4.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findById(_x10, _x11) {
        return ref.apply(this, arguments);
      }

      return findById;
    }()

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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(entities) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var singular, request;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                singular = false;

                if (entities) {
                  _context5.next = 4;
                  break;
                }

                _log.Log.warn('No entity was provided to be saved.', entities);
                return _context5.abrupt('return', null);

              case 4:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.POST,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
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
                    pathname: this.pathname + '/' + entities[idAttribute]
                  });
                }

                _context5.next = 8;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 8:
                entities = _context5.sent;


                if (!(0, _isArray2.default)(entities)) {
                  singular = true;
                  entities = [entities];
                }

                _context5.next = 12;
                return _babybird2.default.all((0, _map2.default)(entities, function (entity) {
                  return _this2.sync.createSaveOperation(_this2.name, entity, options);
                }));

              case 12:
                return _context5.abrupt('return', singular ? entities[0] : entities);

              case 13:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function save(_x13, _x14) {
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(query) {
        var _this3 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, entities, localEntities, syncEntities;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!(query && !(query instanceof _query.Query))) {
                  _context8.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 2:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.DELETE,
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
                _context8.next = 5;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 5:
                entities = _context8.sent;
                localEntities = (0, _filter2.default)(entities, function (entity) {
                  var metadata = new _metadata.Metadata(entity);
                  return metadata.isLocal();
                });
                syncEntities = (0, _xorWith2.default)(entities, localEntities, function (entity, localEntity) {
                  return entity[idAttribute] === localEntity[idAttribute];
                });
                return _context8.abrupt('return', new _babybird2.default(function (reject, resolve) {
                  (0, _parallel2.default)([function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(callback) {
                      var query;
                      return regeneratorRuntime.wrap(function _callee6$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              query = new _query.Query();

                              query.contains('entityId', Object.keys((0, _keyBy2.default)(localEntities, idAttribute)));
                              _context6.next = 4;
                              return _this3.sync.clear(query, options);

                            case 4:
                              callback();

                            case 5:
                            case 'end':
                              return _context6.stop();
                          }
                        }
                      }, _callee6, _this3);
                    }));

                    return function (_x19) {
                      return ref.apply(this, arguments);
                    };
                  }(), function () {
                    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(callback) {
                      return regeneratorRuntime.wrap(function _callee7$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return _this3.sync.createDeleteOperation(_this3.name, syncEntities, options);

                            case 2:
                              callback();

                            case 3:
                            case 'end':
                              return _context7.stop();
                          }
                        }
                      }, _callee7, _this3);
                    }));

                    return function (_x20) {
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
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function remove(_x16, _x17) {
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, entity, metadata, query;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (id) {
                  _context9.next = 3;
                  break;
                }

                _log.Log.warn('No id was provided to be removed.', id);
                return _context9.abrupt('return', null);

              case 3:
                request = new _local.LocalRequest({
                  method: _enums.HttpMethod.DELETE,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                _context9.next = 6;
                return request.execute().then(function (response) {
                  return response.data;
                });

              case 6:
                entity = _context9.sent;
                metadata = new _metadata.Metadata(entity);

                if (!metadata.isLocal()) {
                  _context9.next = 15;
                  break;
                }

                query = new _query.Query();

                query.equalTo('entityId', entity[idAttribute]);
                _context9.next = 13;
                return this.sync.clear(this.name, query, options);

              case 13:
                _context9.next = 17;
                break;

              case 15:
                _context9.next = 17;
                return this.sync.createDeleteOperation(this.name, entity, options);

              case 17:
                return _context9.abrupt('return', entity);

              case 18:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function removeById(_x21, _x22) {
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var count, result;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.syncCount(null, options);

              case 2:
                count = _context10.sent;

                if (!(count > 0)) {
                  _context10.next = 5;
                  break;
                }

                throw new _errors.KinveyError('Unable to pull data. You must push the pending sync items first.', 'Call store.push() to push the pending sync items before you pull new data.');

              case 5:
                _context10.next = 7;
                return _get(Object.getPrototypeOf(SyncStore.prototype), 'find', this).call(this, query, options);

              case 7:
                result = _context10.sent;
                return _context10.abrupt('return', result.networkPromise);

              case 9:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function pull(_x24, _x25) {
        return ref.apply(this, arguments);
      }

      return pull;
    }()
  }]);

  return SyncStore;
}(_cachestore.CacheStore);
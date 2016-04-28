'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NetworkStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _aggregation = require('../aggregation');

var _enums = require('../enums');

var _errors = require('../errors');

var _client = require('../client');

var _network = require('../requests/network');

var _query = require('../query');

var _log = require('../log');

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = 'appdata' || 'appdata';
var idAttribute = '_id' || '_id';
var clientSymbol = Symbol();

/**
 * The NetworkStore class is used to find, save, update, remove, count and group enitities
 * in a collection on the network.
 */

var NetworkStore = exports.NetworkStore = function () {
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
    this.client = _client.Client.sharedInstance();
  }

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  handler: function handler() {}
                }, options);
                options.flags = _qs2.default.parse(options.flags);

                if (!(query && !(query instanceof _query.Query))) {
                  _context.next = 4;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 4:
                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.GET,
                  authType: _enums.AuthType.Default,
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
                return _context.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 6:
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
                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  useDeltaFetch: true,
                  handler: function handler() {}
                }, options);

                if (aggregation instanceof _aggregation.Aggregation) {
                  _context2.next = 3;
                  break;
                }

                throw new _errors.KinveyError('Invalid aggregation. It must be an instance of the Kinvey.Aggregation class.');

              case 3:
                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.GET,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/_group'
                  }),
                  properties: options.properties,
                  data: aggregation.toJSON(),
                  timeout: options.timeout,
                  client: this.client
                });
                return _context2.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 5:
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
                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  useDeltaFetch: true,
                  handler: function handler() {}
                }, options);

                if (!(query && !(query instanceof _query.Query))) {
                  _context3.next = 3;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 3:
                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.GET,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/_count'
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout,
                  client: this.client
                });
                return _context3.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 5:
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

                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  handler: function handler() {}
                }, options);

                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.GET,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  client: this.client
                });
                return _context4.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 6:
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
     * @param   {Object|Array}          doc                                       Document or entities to save.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'save',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(entity) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, id;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (entity) {
                  _context5.next = 3;
                  break;
                }

                _log.Log.warn('No entity was provided to be saved.', entity);
                return _context5.abrupt('return', null);

              case 3:

                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  handler: function handler() {}
                }, options);

                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.POST,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  data: entity,
                  timeout: options.timeout,
                  client: this.client
                });
                id = entity[idAttribute];

                if (id) {
                  request.method = _enums.HttpMethod.PUT;
                  request.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  });
                }

                return _context5.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 8:
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(query) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  handler: function handler() {}
                }, options);

                if (!(query && !(query instanceof _query.Query))) {
                  _context6.next = 3;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Kinvey.Query class.');

              case 3:
                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.DELETE,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  query: query,
                  timeout: options.timeout
                });
                return _context6.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 5:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
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
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (id) {
                  _context7.next = 3;
                  break;
                }

                _log.Log.warn('No id was provided to be removed.', id);
                return _context7.abrupt('return', null);

              case 3:

                options = (0, _assign2.default)({
                  properties: null,
                  timeout: undefined,
                  handler: function handler() {}
                }, options);

                request = new _network.NetworkRequest({
                  method: _enums.HttpMethod.DELETE,
                  authType: _enums.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + id
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                return _context7.abrupt('return', request.execute().then(function (response) {
                  return response.data;
                }));

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function removeById(_x19, _x20) {
        return ref.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'client',
    get: function get() {
      return this[clientSymbol];
    },
    set: function set(client) {
      this[clientSymbol] = client;
    }

    /**
     * The pathname for the store.
     *
     * @return  {string}                Pathname
     */

  }, {
    key: 'pathname',
    get: function get() {
      var pathname = '/' + appdataNamespace;

      if (this.client) {
        pathname = pathname + '/' + this.client.appKey;
      }

      if (this.name) {
        pathname = pathname + '/' + this.name;
      }

      return pathname;
    }
  }]);

  return NetworkStore;
}();
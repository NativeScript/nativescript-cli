'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataStore = exports.SyncStore = exports.CacheStore = exports.NetworkStore = exports.DataStoreType = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _errors = require('./errors');

var _cache = require('./requests/cache');

var _deltafetch = require('./requests/deltafetch');

var _network = require('./requests/network');

var _request = require('./requests/request');

var _query4 = require('./query');

var _observable = require('./utils/observable');

var _client = require('./client');

var _sync = require('./sync');

var _metadata = require('./metadata');

var _es6Promise = require('es6-promise');

var _log = require('./log');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

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

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

/**
 * The NetworkStore class is used to find, create, update, remove, count and group entities over the network.
 */

var NetworkStore = exports.NetworkStore = function () {
  function NetworkStore(collection) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, NetworkStore);

    if (collection && !(0, _isString2.default)(collection)) {
      throw new _errors.KinveyError('Collection must be a string.');
    }

    /**
     * @type {string}
     */
    this.collection = collection;

    /**
     * @type {Client}
     */
    this.client = options.client || _client.Client.sharedInstance();

    /**
     * @type {boolean}
     */
    this.useDeltaFetch = options.useDeltaFetch === true;
  }

  /**
   * The pathname for the store.
   * @return  {string}  Pathname
   */


  _createClass(NetworkStore, [{
    key: 'find',


    /**
     * Returns the live stream for the store.
     * @return {Observable} Observable
     */
    // get liveStream() {
    //   if (typeof(EventSource) === 'undefined') {
    //     throw new KinveyError('Your environment does not support server-sent events.');
    //   }

    //   if (!this._liveStream) {
    //     // Subscribe to KLS
    //     const source = new EventSource(url.format({
    //       protocol: this.client.liveServiceProtocol,
    //       host: this.client.liveServiceHost,
    //       pathname: this.pathname,
    //     }));

    //      // Create a live stream
    //     this._liveStream = KinveyObservable.create(async observer => {
    //       // Open event
    //       source.onopen = (event) => {
    //         Log.info(`Subscription to Kinvey Live Service is now open at ${source.url}.`);
    //         Log.info(event);
    //       };

    //       // Message event
    //       source.onmessage = (message) => {
    //         try {
    //           observer.next(JSON.parse(message.data));
    //         } catch (error) {
    //           observer.error(error);
    //         }
    //       };

    //       // Error event
    //       source.onerror = (error) => {
    //         observer.error(error);
    //       };

    //       // Dispose function
    //       return () => {
    //         observer.complete();
    //       };
    //     }).finally(() => {
    //       source.close();
    //       delete this._liveStream;
    //     });
    //   }

    //   // Return the stream
    //   return this._liveStream;
    // }

    /**
     * Find all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                             Query used to filter entities.
     * @param   {Object}                [options]                           Options
     * @param   {Properties}            [options.properties]                Custom properties to send with
     *                                                                      the request.
     * @param   {Number}                [options.timeout]                   Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
     * @return  {Observable}                                                Observable.
     */
    value: function find(query) {
      var _this = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
      var stream = _observable.KinveyObservable.create(function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Create the request
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    authType: _request.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this.client.protocol,
                      host: _this.client.host,
                      pathname: _this.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this.client
                  });
                  request = new _network.NetworkRequest(config);

                  // Should we use delta fetch?

                  if (useDeltaFetch === true) {
                    request = new _deltafetch.DeltaFetchRequest(config);
                  }

                  // Execute the request
                  _context.next = 8;
                  return request.execute();

                case 8:
                  response = _context.sent;


                  // Send the response
                  observer.next(response.data);
                  _context.next = 15;
                  break;

                case 12:
                  _context.prev = 12;
                  _context.t0 = _context['catch'](0);
                  return _context.abrupt('return', observer.error(_context.t0));

                case 15:
                  return _context.abrupt('return', observer.complete());

                case 16:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this, [[0, 12]]);
        }));

        return function (_x3) {
          return _ref.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Find a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to find.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
      var stream = _observable.KinveyObservable.create(function () {
        var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(observer) {
          var config, request, response, data;
          return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;

                  if (id) {
                    _context2.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context2.next = 13;
                  break;

                case 5:
                  // Fetch data from the network
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    authType: _request.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this2.client.protocol,
                      host: _this2.client.host,
                      pathname: _this2.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout,
                    client: _this2.client
                  });
                  request = new _network.NetworkRequest(config);


                  if (useDeltaFetch === true) {
                    request = new _deltafetch.DeltaFetchRequest(config);
                  }

                  _context2.next = 10;
                  return request.execute();

                case 10:
                  response = _context2.sent;
                  data = response.data;

                  observer.next(data);

                case 13:
                  _context2.next = 18;
                  break;

                case 15:
                  _context2.prev = 15;
                  _context2.t0 = _context2['catch'](0);
                  return _context2.abrupt('return', observer.error(_context2.t0));

                case 18:
                  return _context2.abrupt('return', observer.complete());

                case 19:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this2, [[0, 15]]);
        }));

        return function (_x5) {
          return _ref2.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Count all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                          Query used to filter entities.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(observer) {
          var config, request, response, data;
          return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context3.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Create the request
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    authType: _request.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this3.client.protocol,
                      host: _this3.client.host,
                      pathname: _this3.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this3.client
                  });
                  request = new _network.NetworkRequest(config);

                  // Execute the request

                  _context3.next = 7;
                  return request.execute();

                case 7:
                  response = _context3.sent;
                  data = response.data;

                  // Emit the count

                  observer.next(data ? data.count : 0);
                  _context3.next = 15;
                  break;

                case 12:
                  _context3.prev = 12;
                  _context3.t0 = _context3['catch'](0);
                  return _context3.abrupt('return', observer.error(_context3.t0));

                case 15:
                  return _context3.abrupt('return', observer.complete());

                case 16:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3, [[0, 12]]);
        }));

        return function (_x7) {
          return _ref3.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Create a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to create on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'create',
    value: function create(data) {
      var _this4 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(observer) {
          var singular, responses;
          return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (data) {
                    _context4.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context4.next = 12;
                  break;

                case 5:
                  singular = false;


                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  _context4.next = 9;
                  return _es6Promise.Promise.all((0, _map2.default)(data, function (entity) {
                    var config = new _request.KinveyRequestConfig({
                      method: _request.RequestMethod.POST,
                      authType: _request.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this4.client.protocol,
                        host: _this4.client.host,
                        pathname: _this4.pathname,
                        query: options.query
                      }),
                      properties: options.properties,
                      data: entity,
                      timeout: options.timeout,
                      client: _this4.client
                    });
                    var request = new _network.NetworkRequest(config);
                    return request.execute();
                  }));

                case 9:
                  responses = _context4.sent;


                  data = (0, _map2.default)(responses, function (response) {
                    return response.data;
                  });
                  observer.next(singular ? data[0] : data);

                case 12:
                  _context4.next = 17;
                  break;

                case 14:
                  _context4.prev = 14;
                  _context4.t0 = _context4['catch'](0);
                  return _context4.abrupt('return', observer.error(_context4.t0));

                case 17:
                  return _context4.abrupt('return', observer.complete());

                case 18:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this4, [[0, 14]]);
        }));

        return function (_x9) {
          return _ref4.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Update a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to update on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'update',
    value: function update(data) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5(observer) {
          var singular, responses;
          return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.prev = 0;

                  if (data) {
                    _context5.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context5.next = 12;
                  break;

                case 5:
                  singular = false;


                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  _context5.next = 9;
                  return _es6Promise.Promise.all((0, _map2.default)(data, function (entity) {
                    var config = new _request.KinveyRequestConfig({
                      method: _request.RequestMethod.PUT,
                      authType: _request.AuthType.Default,
                      url: _url2.default.format({
                        protocol: _this5.client.protocol,
                        host: _this5.client.host,
                        pathname: _this5.pathname + '/' + entity[idAttribute],
                        query: options.query
                      }),
                      properties: options.properties,
                      data: entity,
                      timeout: options.timeout,
                      client: _this5.client
                    });
                    var request = new _network.NetworkRequest(config);
                    return request.execute();
                  }));

                case 9:
                  responses = _context5.sent;


                  data = (0, _map2.default)(responses, function (response) {
                    return response.data;
                  });
                  observer.next(singular ? data[0] : data);

                case 12:
                  _context5.next = 17;
                  break;

                case 14:
                  _context5.prev = 14;
                  _context5.t0 = _context5['catch'](0);
                  return _context5.abrupt('return', observer.error(_context5.t0));

                case 17:
                  return _context5.abrupt('return', observer.complete());

                case 18:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this5, [[0, 14]]);
        }));

        return function (_x11) {
          return _ref5.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Save a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to save on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'save',
    value: function save(data, options) {
      if (data[idAttribute]) {
        return this.update(data, options);
      }

      return this.create(data, options);
    }

    /**
     * Remove all entities in the data store. A query can be optionally provided to remove
     * a subset of all entities in a collection or omitted to remove all entities in
     * a collection. The number of entities removed adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                           Query used to filter entities.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'remove',
    value: function remove(query) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref6 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context6.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.DELETE,
                    authType: _request.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this6.client.protocol,
                      host: _this6.client.host,
                      pathname: _this6.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout,
                    client: _this6.client
                  });
                  request = new _network.NetworkRequest(config);
                  _context6.next = 7;
                  return request.execute();

                case 7:
                  response = _context6.sent;

                  observer.next(response.data);
                  _context6.next = 14;
                  break;

                case 11:
                  _context6.prev = 11;
                  _context6.t0 = _context6['catch'](0);
                  return _context6.abrupt('return', observer.error(_context6.t0));

                case 14:
                  return _context6.abrupt('return', observer.complete());

                case 15:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this6, [[0, 11]]);
        }));

        return function (_x13) {
          return _ref6.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Remove a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to remove.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this7 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.prev = 0;

                  if (id) {
                    _context7.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context7.next = 11;
                  break;

                case 5:
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.DELETE,
                    authType: _request.AuthType.Default,
                    url: _url2.default.format({
                      protocol: _this7.client.protocol,
                      host: _this7.client.host,
                      pathname: _this7.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  request = new _network.NetworkRequest(config);
                  _context7.next = 9;
                  return request.execute();

                case 9:
                  response = _context7.sent;

                  observer.next(response.data);

                case 11:
                  _context7.next = 16;
                  break;

                case 13:
                  _context7.prev = 13;
                  _context7.t0 = _context7['catch'](0);
                  return _context7.abrupt('return', observer.error(_context7.t0));

                case 16:
                  return _context7.abrupt('return', observer.complete());

                case 17:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this7, [[0, 13]]);
        }));

        return function (_x15) {
          return _ref7.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Subscribes an observer to a live stream
     */

  }, {
    key: 'subscribe',
    value: function subscribe(subscriber) {
      var _this8 = this;

      // Subscribe to KLS
      if (typeof EventSource !== 'undefined') {
        this.source = new EventSource(_url2.default.format({
          protocol: this.client.liveServiceProtocol,
          host: this.client.liveServiceHost,
          pathname: this.pathname
        }));

        this.source.onopen = function (data) {
          _log.Log.info('Subscription to Kinvey live service is now open.');
          _log.Log.info(data);
        };

        this.source.onmessage = function (message) {
          try {
            subscriber.onNext(JSON.parse(message.data));
          } catch (error) {
            subscriber.onError(error);
            _this8.unsubscribe(subscriber);
          }
        };

        this.source.onerror = function (error) {
          subscriber.onError(error);
          _this8.unsubscribe(subscriber);
        };
      } else {
        throw new _errors.KinveyError('Your environment does not support server-sent events.');
      }

      return function () {
        _this8.unsubscribe(subscriber);
      };
    }
  }, {
    key: 'unsubscribe',
    value: function unsubscribe(subscriber) {
      if (subscriber) {
        subscriber.complete();
      }

      // Close the subscription
      if (this.source) {
        this.source.close();
      }

      this.source = null;
    }
  }, {
    key: 'pathname',
    get: function get() {
      var pathname = '/' + appdataNamespace + '/' + this.client.appKey;

      if (this.collection) {
        pathname = pathname + '/' + this.collection;
      }

      return pathname;
    }
  }]);

  return NetworkStore;
}();

/**
 * The CacheStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */


var CacheStore = exports.CacheStore = function (_NetworkStore) {
  _inherits(CacheStore, _NetworkStore);

  function CacheStore(collection) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, CacheStore);

    /**
     * @type {number|undefined}
     */

    var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheStore).call(this, collection, options));

    _this9.ttl = options.ttl || undefined;

    /**
     * @type {SyncManager}
     */
    _this9.syncManager = new _sync.SyncManager(_this9.collection, options);
    return _this9;
  }

  _createClass(CacheStore, [{
    key: 'find',


    /**
     * Find all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                             Query used to filter entities.
     * @param   {Object}                [options]                           Options
     * @param   {Properties}            [options.properties]                Custom properties to send with
     *                                                                      the request.
     * @param   {Number}                [options.timeout]                   Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
     * @return  {Observable}                                                Observable.
     */
    value: function find(query) {
      var _this10 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(observer) {
          var syncCount, cacheEntities, config, request, response, networkEntities, removedEntities, removedIds, removeQuery, saveConfig, saveRequest;
          return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context8.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:
                  _context8.next = 5;
                  return _this10.pendingSyncCount(null, options);

                case 5:
                  syncCount = _context8.sent;

                  if (!(syncCount > 0)) {
                    _context8.next = 12;
                    break;
                  }

                  _context8.next = 9;
                  return _this10.push(null, options);

                case 9:
                  _context8.next = 11;
                  return _this10.pendingSyncCount(null, options);

                case 11:
                  syncCount = _context8.sent;

                case 12:
                  if (!(syncCount > 0)) {
                    _context8.next = 14;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 14:
                  cacheEntities = [];
                  _context8.prev = 15;

                  // Fetch the cache entities
                  config = new _request.KinveyRequestConfig({
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
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context8.next = 20;
                  return request.execute();

                case 20:
                  response = _context8.sent;

                  cacheEntities = response.data;

                  // Emit the cache entities
                  observer.next(cacheEntities);
                  _context8.next = 27;
                  break;

                case 25:
                  _context8.prev = 25;
                  _context8.t0 = _context8['catch'](15);

                case 27:
                  _context8.next = 29;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'find', _this10).call(_this10, query, options).toPromise();

                case 29:
                  networkEntities = _context8.sent;


                  // Remove entities from the cache that no longer exists
                  removedEntities = (0, _differenceBy2.default)(cacheEntities, networkEntities, idAttribute);
                  removedIds = Object.keys((0, _keyBy2.default)(removedEntities, idAttribute));
                  removeQuery = new _query4.Query().contains(idAttribute, removedIds);
                  _context8.next = 35;
                  return _this10.clear(removeQuery, options);

                case 35:

                  // Save network entities to cache
                  saveConfig = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this10.client.protocol,
                      host: _this10.client.host,
                      pathname: _this10.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: networkEntities,
                    timeout: options.timeout
                  });
                  saveRequest = new _cache.CacheRequest(saveConfig);
                  _context8.next = 39;
                  return saveRequest.execute();

                case 39:

                  // Emit the network entities
                  observer.next(networkEntities);
                  _context8.next = 45;
                  break;

                case 42:
                  _context8.prev = 42;
                  _context8.t1 = _context8['catch'](0);
                  return _context8.abrupt('return', observer.error(_context8.t1));

                case 45:
                  return _context8.abrupt('return', observer.complete());

                case 46:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8, _this10, [[0, 42], [15, 25]]);
        }));

        return function (_x18) {
          return _ref8.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Find a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to find.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this11 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref9 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee9(observer) {
          var syncCount, config, request, response, cacheEntity, networkEntity, saveConfig, saveRequest;
          return _regeneratorRuntime2.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.prev = 0;

                  if (id) {
                    _context9.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context9.next = 36;
                  break;

                case 5:
                  _context9.next = 7;
                  return _this11.pendingSyncCount(null, options);

                case 7:
                  syncCount = _context9.sent;

                  if (!(syncCount > 0)) {
                    _context9.next = 14;
                    break;
                  }

                  _context9.next = 11;
                  return _this11.push(null, options);

                case 11:
                  _context9.next = 13;
                  return _this11.pendingSyncCount(null, options);

                case 13:
                  syncCount = _context9.sent;

                case 14:
                  if (!(syncCount > 0)) {
                    _context9.next = 16;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 16:
                  _context9.prev = 16;

                  // Fetch from the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this11.client.protocol,
                      host: _this11.client.host,
                      pathname: _this11.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);
                  _context9.next = 21;
                  return request.execute();

                case 21:
                  response = _context9.sent;
                  cacheEntity = response.data;

                  // Emit the cache entity

                  observer.next(cacheEntity);
                  _context9.next = 28;
                  break;

                case 26:
                  _context9.prev = 26;
                  _context9.t0 = _context9['catch'](16);

                case 28:
                  _context9.next = 30;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'findById', _this11).call(_this11, id, options).toPromise();

                case 30:
                  networkEntity = _context9.sent;


                  // Save the network entity to cache
                  saveConfig = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this11.client.protocol,
                      host: _this11.client.host,
                      pathname: _this11.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: networkEntity,
                    timeout: options.timeout
                  });
                  saveRequest = new _cache.CacheRequest(saveConfig);
                  _context9.next = 35;
                  return saveRequest.execute();

                case 35:

                  // Emit the network entity
                  observer.next(networkEntity);

                case 36:
                  _context9.next = 41;
                  break;

                case 38:
                  _context9.prev = 38;
                  _context9.t1 = _context9['catch'](0);
                  return _context9.abrupt('return', observer.error(_context9.t1));

                case 41:
                  return _context9.abrupt('return', observer.complete());

                case 42:
                case 'end':
                  return _context9.stop();
              }
            }
          }, _callee9, _this11, [[0, 38], [16, 26]]);
        }));

        return function (_x20) {
          return _ref9.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Count all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                          Query used to filter entities.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this12 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref10 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee10(observer) {
          var syncCount, config, request, response, data, networkCount;
          return _regeneratorRuntime2.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  _context10.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context10.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:
                  _context10.next = 5;
                  return _this12.pendingSyncCount(null, options);

                case 5:
                  syncCount = _context10.sent;

                  if (!(syncCount > 0)) {
                    _context10.next = 12;
                    break;
                  }

                  _context10.next = 9;
                  return _this12.push(null, options);

                case 9:
                  _context10.next = 11;
                  return _this12.pendingSyncCount(null, options);

                case 11:
                  syncCount = _context10.sent;

                case 12:
                  if (!(syncCount > 0)) {
                    _context10.next = 14;
                    break;
                  }

                  throw new _errors.KinveyError('Unable to load data from the network.' + (' There are ' + syncCount + ' entities that need') + ' to be synced before data is loaded from the network.');

                case 14:
                  _context10.prev = 14;

                  // Count the entities in the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this12.client.protocol,
                      host: _this12.client.host,
                      pathname: _this12.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context10.next = 19;
                  return request.execute();

                case 19:
                  response = _context10.sent;
                  data = response.data;

                  // Emit the cache count

                  observer.next(data ? data.count : 0);
                  _context10.next = 26;
                  break;

                case 24:
                  _context10.prev = 24;
                  _context10.t0 = _context10['catch'](14);

                case 26:
                  _context10.next = 28;
                  return _get(Object.getPrototypeOf(CacheStore.prototype), 'count', _this12).call(_this12, query, options).toPromise();

                case 28:
                  networkCount = _context10.sent;


                  // Emit the network count
                  observer.next(networkCount);
                  _context10.next = 35;
                  break;

                case 32:
                  _context10.prev = 32;
                  _context10.t1 = _context10['catch'](0);
                  return _context10.abrupt('return', observer.error(_context10.t1));

                case 35:
                  return _context10.abrupt('return', observer.complete());

                case 36:
                case 'end':
                  return _context10.stop();
              }
            }
          }, _callee10, _this12, [[0, 32], [14, 24]]);
        }));

        return function (_x22) {
          return _ref10.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Create a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to create on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'create',
    value: function create(data) {
      var _this13 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref11 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee11(observer) {
          var singular, config, request, response, ids, query, results, entities;
          return _regeneratorRuntime2.default.wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  _context11.prev = 0;

                  if (data) {
                    _context11.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context11.next = 26;
                  break;

                case 5:
                  singular = false;

                  // Cast the data to an array

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  // Save the data to the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.POST,
                    url: _url2.default.format({
                      protocol: _this13.client.protocol,
                      host: _this13.client.host,
                      pathname: _this13.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context11.next = 11;
                  return request.execute();

                case 11:
                  response = _context11.sent;

                  data = response.data;

                  // Add a create operation to sync
                  _context11.next = 15;
                  return _this13.syncManager.addCreateOperation(data, options);

                case 15:
                  if (!(_this13.syncAutomatically === true)) {
                    _context11.next = 25;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context11.next = 20;
                  return _this13.push(query, options);

                case 20:
                  results = _context11.sent;
                  entities = (0, _map2.default)(results, function (result) {
                    return result.entity;
                  });

                  // Emit the data

                  observer.next(singular ? entities[0] : entities);
                  _context11.next = 26;
                  break;

                case 25:
                  // Emit the data
                  observer.next(singular ? data[0] : data);

                case 26:
                  _context11.next = 31;
                  break;

                case 28:
                  _context11.prev = 28;
                  _context11.t0 = _context11['catch'](0);
                  return _context11.abrupt('return', observer.error(_context11.t0));

                case 31:
                  return _context11.abrupt('return', observer.complete());

                case 32:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11, _this13, [[0, 28]]);
        }));

        return function (_x24) {
          return _ref11.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Update a single or an array of entities on the data store.
     *
     * @param   {Object|Array}          data                              Data that you want to update on the data store.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'update',
    value: function update(data) {
      var _this14 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref12 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee12(observer) {
          var singular, config, request, response, ids, query, results, entities;
          return _regeneratorRuntime2.default.wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  _context12.prev = 0;

                  if (data) {
                    _context12.next = 5;
                    break;
                  }

                  observer.next(null);
                  _context12.next = 26;
                  break;

                case 5:
                  singular = false;

                  // Cast the data to an array

                  if (!(0, _isArray2.default)(data)) {
                    singular = true;
                    data = [data];
                  }

                  // Save the data to the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.PUT,
                    url: _url2.default.format({
                      protocol: _this14.client.protocol,
                      host: _this14.client.host,
                      pathname: _this14.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    body: data,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context12.next = 11;
                  return request.execute();

                case 11:
                  response = _context12.sent;

                  data = response.data;

                  // Add an update operation to sync
                  _context12.next = 15;
                  return _this14.syncManager.addUpdateOperation(data, options);

                case 15:
                  if (!(_this14.syncAutomatically === true)) {
                    _context12.next = 25;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(data, idAttribute));
                  query = new _query4.Query().contains('entityId', ids);
                  _context12.next = 20;
                  return _this14.push(query, options);

                case 20:
                  results = _context12.sent;
                  entities = (0, _map2.default)(results, function (result) {
                    return result.entity;
                  });

                  // Emit the data

                  observer.next(singular ? entities[0] : entities);
                  _context12.next = 26;
                  break;

                case 25:
                  // Emit the data
                  observer.next(singular ? data[0] : data);

                case 26:
                  _context12.next = 31;
                  break;

                case 28:
                  _context12.prev = 28;
                  _context12.t0 = _context12['catch'](0);
                  return _context12.abrupt('return', observer.error(_context12.t0));

                case 31:
                  return _context12.abrupt('return', observer.complete());

                case 32:
                case 'end':
                  return _context12.stop();
              }
            }
          }, _callee12, _this14, [[0, 28]]);
        }));

        return function (_x26) {
          return _ref12.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Remove all entities in the data store. A query can be optionally provided to remove
     * a subset of all entities in a collection or omitted to remove all entities in
     * a collection. The number of entities removed adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                           Query used to filter entities.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'remove',
    value: function remove(query) {
      var _this15 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref13 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee13(observer) {
          var config, request, response, entities, localEntities, _query, syncData, ids, _query2;

          return _regeneratorRuntime2.default.wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  _context13.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context13.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Remove the data from the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this15.client.protocol,
                      host: _this15.client.host,
                      pathname: _this15.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context13.next = 7;
                  return request.execute();

                case 7:
                  response = _context13.sent;
                  entities = response.data;

                  if (!(entities && entities.length > 0)) {
                    _context13.next = 17;
                    break;
                  }

                  // Clear local entities from the sync table
                  localEntities = (0, _filter2.default)(entities, function (entity) {
                    var metadata = new _metadata.Metadata(entity);
                    return metadata.isLocal();
                  });
                  _query = new _query4.Query().contains('entityId', Object.keys((0, _keyBy2.default)(localEntities, idAttribute)));
                  _context13.next = 14;
                  return _this15.clearSync(_query, options);

                case 14:

                  // Create delete operations for non local data in the sync table
                  syncData = (0, _xorWith2.default)(entities, localEntities, function (entity, localEntity) {
                    return entity[idAttribute] === localEntity[idAttribute];
                  });
                  _context13.next = 17;
                  return _this15.syncManager.addDeleteOperation(syncData, options);

                case 17:
                  if (!(_this15.syncAutomatically === true)) {
                    _context13.next = 22;
                    break;
                  }

                  ids = Object.keys((0, _keyBy2.default)(entities, idAttribute));
                  _query2 = new _query4.Query().contains('entityId', ids);
                  _context13.next = 22;
                  return _this15.push(_query2, options);

                case 22:

                  // Emit the data
                  observer.next(entities);
                  _context13.next = 28;
                  break;

                case 25:
                  _context13.prev = 25;
                  _context13.t0 = _context13['catch'](0);
                  return _context13.abrupt('return', observer.error(_context13.t0));

                case 28:
                  return _context13.abrupt('return', observer.complete());

                case 29:
                case 'end':
                  return _context13.stop();
              }
            }
          }, _callee13, _this15, [[0, 25]]);
        }));

        return function (_x28) {
          return _ref13.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Remove a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to remove.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this16 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref14 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee14(observer) {
          var config, request, response, entity, metadata, query, _query3;

          return _regeneratorRuntime2.default.wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  _context14.prev = 0;

                  if (id) {
                    _context14.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context14.next = 27;
                  break;

                case 5:
                  // Remove from cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this16.client.protocol,
                      host: _this16.client.host,
                      pathname: _this16.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    authType: _request.AuthType.Default,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context14.next = 9;
                  return request.execute();

                case 9:
                  response = _context14.sent;
                  entity = response.data;

                  if (!entity) {
                    _context14.next = 22;
                    break;
                  }

                  metadata = new _metadata.Metadata(entity);

                  // Clear any pending sync items if the entity
                  // was created locally

                  if (!metadata.isLocal()) {
                    _context14.next = 20;
                    break;
                  }

                  query = new _query4.Query();

                  query.equalTo('entityId', entity[idAttribute]);
                  _context14.next = 18;
                  return _this16.clearSync(query, options);

                case 18:
                  _context14.next = 22;
                  break;

                case 20:
                  _context14.next = 22;
                  return _this16.syncManager.addDeleteOperation(entity, options);

                case 22:
                  if (!(_this16.syncAutomatically === true)) {
                    _context14.next = 26;
                    break;
                  }

                  _query3 = new _query4.Query().equalTo('entityId', entity[idAttribute]);
                  _context14.next = 26;
                  return _this16.push(_query3, options);

                case 26:

                  // Emit the data
                  observer.next(entity);

                case 27:
                  _context14.next = 32;
                  break;

                case 29:
                  _context14.prev = 29;
                  _context14.t0 = _context14['catch'](0);
                  return _context14.abrupt('return', observer.error(_context14.t0));

                case 32:
                  return _context14.abrupt('return', observer.complete());

                case 33:
                case 'end':
                  return _context14.stop();
              }
            }
          }, _callee14, _this16, [[0, 29]]);
        }));

        return function (_x30) {
          return _ref14.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Remove all entities in the data store that are stored locally.
     *
     * @param   {Query}                 [query]                           Query used to filter entities.
     * @param   {Object}                [options]                         Options
     * @param   {Properties}            [options.properties]              Custom properties to send with
     *                                                                    the request.
     * @param   {Number}                [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                                 Promise.
     */

  }, {
    key: 'clear',
    value: function clear(query) {
      var _this17 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref15 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee15(observer) {
          var config, request, response, data, syncQuery;
          return _regeneratorRuntime2.default.wrap(function _callee15$(_context15) {
            while (1) {
              switch (_context15.prev = _context15.next) {
                case 0:
                  _context15.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context15.next = 5;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 5:
                  // Create the request
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.DELETE,
                    url: _url2.default.format({
                      protocol: _this17.client.protocol,
                      host: _this17.client.host,
                      pathname: _this17.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context15.next = 9;
                  return request.execute();

                case 9:
                  response = _context15.sent;
                  data = response.data;

                  // Remove the data from sync

                  if (!(data && data.length > 0)) {
                    _context15.next = 17;
                    break;
                  }

                  syncQuery = new _query4.Query().contains('entityId', Object.keys((0, _keyBy2.default)(data, idAttribute)));
                  _context15.next = 15;
                  return _this17.clearSync(syncQuery, options);

                case 15:
                  _context15.next = 20;
                  break;

                case 17:
                  if (query) {
                    _context15.next = 20;
                    break;
                  }

                  _context15.next = 20;
                  return _this17.clearSync(null, options);

                case 20:

                  observer.next(data);

                case 21:
                  _context15.next = 26;
                  break;

                case 23:
                  _context15.prev = 23;
                  _context15.t0 = _context15['catch'](0);
                  return _context15.abrupt('return', observer.error(_context15.t0));

                case 26:
                  return _context15.abrupt('return', observer.complete());

                case 27:
                case 'end':
                  return _context15.stop();
              }
            }
          }, _callee15, _this17, [[0, 23]]);
        }));

        return function (_x32) {
          return _ref15.apply(this, arguments);
        };
      }());

      return stream.toPromise();
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
     */

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

    /**
     * Push sync items for the data store to the network. A promise will be returned that will be
     * resolved with the result of the push or rejected with an error.
     *
     * @param   {Query}                 [query]                                   Query to push a subset of items.
     * @param   {Object}                options                                   Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @return  {Promise}                                                         Promise
     */

  }, {
    key: 'push',
    value: function push(query, options) {
      return this.syncManager.push(query, options);
    }

    /**
     * Pull items for the data store from the network to your local cache. A promise will be
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
    value: function pull(query, options) {
      return this.syncManager.pull(query, options);
    }

    /**
     * Sync items for the data store. This will push pending sync items first and then
     * pull items from the network into your local cache. A promise will be
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
    key: 'sync',
    value: function sync(query, options) {
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
}(NetworkStore);

/**
 * The SyncStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */


var SyncStore = exports.SyncStore = function (_CacheStore) {
  _inherits(SyncStore, _CacheStore);

  function SyncStore() {
    _classCallCheck(this, SyncStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SyncStore).apply(this, arguments));
  }

  _createClass(SyncStore, [{
    key: 'find',


    /**
     * Find all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                             Query used to filter entities.
     * @param   {Object}                [options]                           Options
     * @param   {Properties}            [options.properties]                Custom properties to send with
     *                                                                      the request.
     * @param   {Number}                [options.timeout]                   Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]             Turn on or off the use of delta fetch.
     * @return  {Observable}                                                Observable.
     */
    value: function find(query) {
      var _this19 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref16 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee16(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee16$(_context16) {
            while (1) {
              switch (_context16.prev = _context16.next) {
                case 0:
                  _context16.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context16.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Create the request
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this19.client.protocol,
                      host: _this19.client.host,
                      pathname: _this19.pathname,
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context16.next = 7;
                  return request.execute();

                case 7:
                  response = _context16.sent;


                  // Send the response
                  observer.next(response.data);
                  _context16.next = 14;
                  break;

                case 11:
                  _context16.prev = 11;
                  _context16.t0 = _context16['catch'](0);
                  return _context16.abrupt('return', observer.error(_context16.t0));

                case 14:
                  return _context16.abrupt('return', observer.complete());

                case 15:
                case 'end':
                  return _context16.stop();
              }
            }
          }, _callee16, _this19, [[0, 11]]);
        }));

        return function (_x34) {
          return _ref16.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Find a single entity in the data store by id.
     *
     * @param   {string}                id                               Entity by id to find.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @param   {Boolean}               [options.useDeltaFetch]          Turn on or off the use of delta fetch.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'findById',
    value: function findById(id) {
      var _this20 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref17 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee17(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  _context17.prev = 0;

                  if (id) {
                    _context17.next = 5;
                    break;
                  }

                  observer.next(undefined);
                  _context17.next = 11;
                  break;

                case 5:
                  // Create the request
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this20.client.protocol,
                      host: _this20.client.host,
                      pathname: _this20.pathname + '/' + id,
                      query: options.query
                    }),
                    properties: options.properties,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context17.next = 9;
                  return request.execute();

                case 9:
                  response = _context17.sent;


                  // Emit the data
                  observer.next(response.data);

                case 11:
                  _context17.next = 16;
                  break;

                case 13:
                  _context17.prev = 13;
                  _context17.t0 = _context17['catch'](0);
                  return _context17.abrupt('return', observer.error(_context17.t0));

                case 16:
                  return _context17.abrupt('return', observer.complete());

                case 17:
                case 'end':
                  return _context17.stop();
              }
            }
          }, _callee17, _this20, [[0, 13]]);
        }));

        return function (_x36) {
          return _ref17.apply(this, arguments);
        };
      }());

      return stream;
    }

    /**
     * Count all entities in the data store. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                          Query used to filter entities.
     * @param   {Object}                [options]                        Options
     * @param   {Properties}            [options.properties]             Custom properties to send with
     *                                                                   the request.
     * @param   {Number}                [options.timeout]                Timeout for the request.
     * @return  {Observable}                                             Observable.
     */

  }, {
    key: 'count',
    value: function count(query) {
      var _this21 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var stream = _observable.KinveyObservable.create(function () {
        var _ref18 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee18(observer) {
          var config, request, response, data;
          return _regeneratorRuntime2.default.wrap(function _callee18$(_context18) {
            while (1) {
              switch (_context18.prev = _context18.next) {
                case 0:
                  _context18.prev = 0;

                  if (!(query && !(query instanceof _query4.Query))) {
                    _context18.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Count the entities in the cache
                  config = new _request.KinveyRequestConfig({
                    method: _request.RequestMethod.GET,
                    url: _url2.default.format({
                      protocol: _this21.client.protocol,
                      host: _this21.client.host,
                      pathname: _this21.pathname + '/_count',
                      query: options.query
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });
                  request = new _cache.CacheRequest(config);

                  // Execute the request

                  _context18.next = 7;
                  return request.execute();

                case 7:
                  response = _context18.sent;
                  data = response.data;

                  // Emit the cache count

                  observer.next(data ? data.count : 0);
                  _context18.next = 15;
                  break;

                case 12:
                  _context18.prev = 12;
                  _context18.t0 = _context18['catch'](0);
                  return _context18.abrupt('return', observer.error(_context18.t0));

                case 15:
                  return _context18.abrupt('return', observer.complete());

                case 16:
                case 'end':
                  return _context18.stop();
              }
            }
          }, _callee18, _this21, [[0, 12]]);
        }));

        return function (_x38) {
          return _ref18.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: 'syncAutomatically',
    get: function get() {
      return false;
    }
  }]);

  return SyncStore;
}(CacheStore);

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */


var DataStore = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);

    throw new _errors.KinveyError('Not allowed to construct a DataStore instance.' + ' Please use the collection() function to retrieve an instance of a DataStore instance.');
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [collection]                  Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
   * @return {DataStore}                                  DataStore instance.
   */


  _createClass(DataStore, null, [{
    key: 'collection',
    value: function collection(_collection) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Cache : arguments[1];
      var options = arguments[2];

      var store = void 0;

      if (!_collection) {
        throw new _errors.KinveyError('A collection is required.');
      }

      switch (type) {
        case DataStoreType.Network:
          store = new NetworkStore(_collection, options);
          break;
        case DataStoreType.Sync:
          store = new SyncStore(_collection, options);
          break;
        case DataStoreType.Cache:
        default:
          store = new CacheStore(_collection, options);

      }

      return store;
    }

    /**
     * @private
     */

  }, {
    key: 'getInstance',
    value: function getInstance(collection, type, options) {
      return this.collection(collection, type, options);
    }

    /**
     * Clear the cache. This will delete all data in the cache.
     *
     * @param  {Object} [options={}] Options
     * @return {Promise<Object>} The result of clearing the cache.
     */

  }, {
    key: 'clearCache',
    value: function () {
      var _ref19 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee19() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var client, pathname, config, request, response;
        return _regeneratorRuntime2.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                client = options.client || _client.Client.sharedInstance();
                pathname = '/' + appdataNamespace + '/' + client.appKey;
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.DELETE,
                  url: _url2.default.format({
                    protocol: client.protocol,
                    host: client.host,
                    pathname: pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  timeout: options.timeout
                });
                request = new _cache.CacheRequest(config);
                _context19.next = 6;
                return request.execute();

              case 6:
                response = _context19.sent;
                return _context19.abrupt('return', response.data);

              case 8:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function clearCache(_x40) {
        return _ref19.apply(this, arguments);
      }

      return clearCache;
    }()
  }]);

  return DataStore;
}();

exports.DataStore = DataStore;
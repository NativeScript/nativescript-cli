'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NetworkStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _request = require('../../request');

var _errors = require('../../errors');

var _query = require('../../query');

var _client = require('../../client');

var _es6Promise = require('es6-promise');

var _utils = require('../../utils');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _es6Promise.Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _es6Promise.Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

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
      var stream = _utils.KinveyObservable.create(function () {
        var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(observer) {
          var config, request, response;
          return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;

                  if (!(query && !(query instanceof _query.Query))) {
                    _context.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Create the request
                  config = {
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
                  };
                  request = new _request.KinveyRequest(config);

                  // Should we use delta fetch?

                  if (useDeltaFetch === true) {
                    request = new _request.DeltaFetchRequest(config);
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
      var stream = _utils.KinveyObservable.create(function () {
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
                  config = {
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
                  };
                  request = new _request.KinveyRequest(config);


                  if (useDeltaFetch === true) {
                    request = new _request.DeltaFetchRequest(config);
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

      var stream = _utils.KinveyObservable.create(function () {
        var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(observer) {
          var request, response, data;
          return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!(query && !(query instanceof _query.Query))) {
                    _context3.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:

                  // Create the request
                  request = new _request.KinveyRequest({
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

                  // Execute the request

                  _context3.next = 6;
                  return request.execute();

                case 6:
                  response = _context3.sent;
                  data = response.data;

                  // Emit the count

                  observer.next(data ? data.count : 0);
                  _context3.next = 14;
                  break;

                case 11:
                  _context3.prev = 11;
                  _context3.t0 = _context3['catch'](0);
                  return _context3.abrupt('return', observer.error(_context3.t0));

                case 14:
                  return _context3.abrupt('return', observer.complete());

                case 15:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3, [[0, 11]]);
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

      var stream = _utils.KinveyObservable.create(function () {
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
                    var request = new _request.KinveyRequest({
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

      var stream = _utils.KinveyObservable.create(function () {
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
                    var request = new _request.KinveyRequest({
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

      var stream = _utils.KinveyObservable.create(function () {
        var _ref6 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee6(observer) {
          var request, response;
          return _regeneratorRuntime2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.prev = 0;

                  if (!(query && !(query instanceof _query.Query))) {
                    _context6.next = 3;
                    break;
                  }

                  throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

                case 3:
                  request = new _request.KinveyRequest({
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
                  _context6.next = 6;
                  return request.execute();

                case 6:
                  response = _context6.sent;

                  observer.next(response.data);
                  _context6.next = 13;
                  break;

                case 10:
                  _context6.prev = 10;
                  _context6.t0 = _context6['catch'](0);
                  return _context6.abrupt('return', observer.error(_context6.t0));

                case 13:
                  return _context6.abrupt('return', observer.complete());

                case 14:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this6, [[0, 10]]);
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

      var stream = _utils.KinveyObservable.create(function () {
        var _ref7 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee7(observer) {
          var request, response;
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
                  _context7.next = 10;
                  break;

                case 5:
                  request = new _request.KinveyRequest({
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
                  _context7.next = 8;
                  return request.execute();

                case 8:
                  response = _context7.sent;

                  observer.next(response.data);

                case 10:
                  _context7.next = 15;
                  break;

                case 12:
                  _context7.prev = 12;
                  _context7.t0 = _context7['catch'](0);
                  return _context7.abrupt('return', observer.error(_context7.t0));

                case 15:
                  return _context7.abrupt('return', observer.complete());

                case 16:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this7, [[0, 12]]);
        }));

        return function (_x15) {
          return _ref7.apply(this, arguments);
        };
      }());

      return stream.toPromise();
    }

    /**
     * Subscribes to a live stream
     */

  }, {
    key: 'subscribe',
    value: function subscribe(onNext, onError, onComplete) {
      return this.liveStream.subscribe(onNext, onError, onComplete);
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

    /**
     * Returns the live stream for the store.
     * @return {Observable} Observable
     */

  }, {
    key: 'liveStream',
    get: function get() {
      var _this8 = this;

      if (typeof EventSource === 'undefined') {
        throw new _errors.KinveyError('Your environment does not support server-sent events.');
      }

      if (!this._liveStream) {
        (function () {
          // Subscribe to KLS
          var source = new EventSource(_url2.default.format({
            protocol: _this8.client.liveServiceProtocol,
            host: _this8.client.liveServiceHost,
            pathname: _this8.pathname
          }));

          // Create a live stream
          _this8._liveStream = _utils.KinveyObservable.create(function () {
            var _ref8 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee8(observer) {
              return _regeneratorRuntime2.default.wrap(function _callee8$(_context8) {
                while (1) {
                  switch (_context8.prev = _context8.next) {
                    case 0:
                      // Open event
                      source.onopen = function (event) {
                        _utils.Log.info('Subscription to Kinvey Live Service is now open at ' + source.url + '.');
                        _utils.Log.info(event);
                      };

                      // Message event
                      source.onmessage = function (message) {
                        try {
                          observer.next(JSON.parse(message.data));
                        } catch (error) {
                          observer.error(error);
                        }
                      };

                      // Error event
                      source.onerror = function (error) {
                        observer.error(error);
                      };

                      // Dispose function
                      return _context8.abrupt('return', function () {
                        observer.complete();
                      });

                    case 4:
                    case 'end':
                      return _context8.stop();
                  }
                }
              }, _callee8, _this8);
            }));

            return function (_x16) {
              return _ref8.apply(this, arguments);
            };
          }()).finally(function () {
            source.close();
            delete _this8._liveStream;
          });
        })();
      }

      // Return the stream
      return this._liveStream;
    }
  }]);

  return NetworkStore;
}();
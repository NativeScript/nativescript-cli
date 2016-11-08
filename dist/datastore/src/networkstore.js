'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('../../request');

var _errors = require('../../errors');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _client = require('../../client');

var _utils = require('../../utils');

var _aggregation = require('../../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || undefined || 'appdata';

var NetworkStore = function () {
  function NetworkStore(collection) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, NetworkStore);

    if (collection && !(0, _isString2.default)(collection)) {
      throw new _errors.KinveyError('Collection must be a string.');
    }

    this.collection = collection;

    this.client = options.client || _client.Client.sharedInstance();

    this.useDeltaFetch = options.useDeltaFetch === true;
  }

  _createClass(NetworkStore, [{
    key: 'find',
    value: function find(query) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var useDeltaFetch = options.useDeltaFetch === true || this.useDeltaFetch;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if ((0, _utils.isDefined)(query) && !(query instanceof _query2.default)) {
          return observer.error(new _errors.KinveyError('Invalid query. It must be an instance of the Query class.'));
        }

        var config = {
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
        var request = new _request.KinveyRequest(config);

        if (useDeltaFetch === true) {
          request = new _request.DeltaFetchRequest(config);
        }

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return observer.next(data);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });
      return stream;
    }
  }, {
    key: 'findById',
    value: function findById(id) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var useDeltaFetch = options.useDeltaFetch || this.useDeltaFetch;
      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!id) {
          observer.next(undefined);
          return observer.compelete();
        }

        var config = {
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
        var request = new _request.KinveyRequest(config);

        if (useDeltaFetch === true) {
          request = new _request.DeltaFetchRequest(config);
        }

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return observer.next(data);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });

      return stream;
    }
  }, {
    key: 'group',
    value: function group(aggregation) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        if (!(aggregation instanceof _aggregation2.default)) {
          return observer.error(new _errors.KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.'));
        }

        var request = new _request.KinveyRequest({
          method: _request.RequestMethod.GET,
          authType: _request.AuthType.Default,
          url: _url2.default.format({
            protocol: _this3.client.protocol,
            host: _this3.client.host,
            pathname: _this3.pathname + '/_group'
          }),
          properties: options.properties,
          aggregation: aggregation,
          timeout: options.timeout,
          client: _this3.client
        });

        return request.execute().then(function (response) {
          return response.data;
        }).then(function (data) {
          return observer.next(data);
        }).then(function () {
          return observer.complete();
        }).catch(function (error) {
          return observer.error(error);
        });
      });
      return stream;
    }
  }, {
    key: 'count',
    value: function count(query) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          if (query && !(query instanceof _query2.default)) {
            throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');
          }

          var request = new _request.KinveyRequest({
            method: _request.RequestMethod.GET,
            authType: _request.AuthType.Default,
            url: _url2.default.format({
              protocol: _this4.client.protocol,
              host: _this4.client.host,
              pathname: _this4.pathname + '/_count',
              query: options.query
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout,
            client: _this4.client
          });

          return request.execute().then(function (response) {
            return response.data;
          }).then(function (data) {
            return observer.next(data ? data.count : 0);
          }).then(function () {
            return observer.complete();
          }).catch(function (error) {
            return observer.error(error);
          });
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream;
    }
  }, {
    key: 'create',
    value: function create(entities) {
      var _this5 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          var _ret = function () {
            if (!entities) {
              observer.next(null);
              return {
                v: observer.compelete()
              };
            }

            var singular = false;

            if (!(0, _isArray2.default)(entities)) {
              singular = true;
              entities = [entities];
            }

            return {
              v: _es6Promise2.default.all((0, _map2.default)(entities, function (entity) {
                var request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Default,
                  url: _url2.default.format({
                    protocol: _this5.client.protocol,
                    host: _this5.client.host,
                    pathname: _this5.pathname,
                    query: options.query
                  }),
                  properties: options.properties,
                  data: entity,
                  timeout: options.timeout,
                  client: _this5.client
                });
                return request.execute();
              })).then(function (responses) {
                return (0, _map2.default)(responses, function (response) {
                  return response.data;
                });
              }).then(function (data) {
                return observer.next(singular ? data[0] : data);
              }).then(function () {
                return observer.complete();
              }).catch(function (error) {
                return observer.error(error);
              })
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream.toPromise();
    }
  }, {
    key: 'update',
    value: function update(entities) {
      var _this6 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          var _ret2 = function () {
            if (!entities) {
              observer.next(null);
              return {
                v: observer.compelete()
              };
            }

            var singular = false;

            if (!(0, _isArray2.default)(entities)) {
              singular = true;
              entities = [entities];
            }

            return {
              v: _es6Promise2.default.all((0, _map2.default)(entities, function (entity) {
                var request = new _request.KinveyRequest({
                  method: _request.RequestMethod.PUT,
                  authType: _request.AuthType.Default,
                  url: _url2.default.format({
                    protocol: _this6.client.protocol,
                    host: _this6.client.host,
                    pathname: _this6.pathname + '/' + entity._id,
                    query: options.query
                  }),
                  properties: options.properties,
                  data: entity,
                  timeout: options.timeout,
                  client: _this6.client
                });
                return request.execute();
              })).then(function (responses) {
                return (0, _map2.default)(responses, function (response) {
                  return response.data;
                });
              }).then(function (data) {
                return observer.next(singular ? data[0] : data);
              }).then(function () {
                return observer.complete();
              }).catch(function (error) {
                return observer.error(error);
              })
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream.toPromise();
    }
  }, {
    key: 'save',
    value: function save(entity, options) {
      if (entity._id) {
        return this.update(entity, options);
      }

      return this.create(entity, options);
    }
  }, {
    key: 'remove',
    value: function remove(query) {
      var _this7 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          if (query && !(query instanceof _query2.default)) {
            throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');
          }

          var request = new _request.KinveyRequest({
            method: _request.RequestMethod.DELETE,
            authType: _request.AuthType.Default,
            url: _url2.default.format({
              protocol: _this7.client.protocol,
              host: _this7.client.host,
              pathname: _this7.pathname,
              query: options.query
            }),
            properties: options.properties,
            query: query,
            timeout: options.timeout,
            client: _this7.client
          });
          return request.execute().then(function (response) {
            return response.data;
          }).then(function (data) {
            return observer.next(data);
          }).then(function () {
            return observer.complete();
          }).catch(function (error) {
            return observer.error(error);
          });
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream.toPromise();
    }
  }, {
    key: 'removeById',
    value: function removeById(id) {
      var _this8 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _utils.KinveyObservable.create(function (observer) {
        try {
          if (!id) {
            observer.next(undefined);
            return observer.compelete();
          }

          var request = new _request.KinveyRequest({
            method: _request.RequestMethod.DELETE,
            authType: _request.AuthType.Default,
            url: _url2.default.format({
              protocol: _this8.client.protocol,
              host: _this8.client.host,
              pathname: _this8.pathname + '/' + id,
              query: options.query
            }),
            properties: options.properties,
            timeout: options.timeout
          });
          return request.execute().then(function (response) {
            return response.data;
          }).then(function (data) {
            return observer.next(data);
          }).then(function () {
            return observer.complete();
          }).catch(function (error) {
            return observer.error(error);
          });
        } catch (error) {
          return observer.error(error);
        }
      });

      return stream.toPromise();
    }
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
  }, {
    key: 'liveStream',
    get: function get() {
      var _this9 = this;

      if (typeof EventSource === 'undefined') {
        throw new _errors.KinveyError('Your environment does not support server-sent events.');
      }

      if (!this._liveStream) {
        (function () {
          var source = new EventSource(_url2.default.format({
            protocol: _this9.client.liveServiceProtocol,
            host: _this9.client.liveServiceHost,
            pathname: _this9.pathname
          }));

          _this9._liveStream = _utils.KinveyObservable.create(function (observer) {
            source.onopen = function (event) {
              _utils.Log.info('Subscription to Kinvey Live Service is now open at ' + source.url + '.');
              _utils.Log.info(event);
            };

            source.onmessage = function (message) {
              try {
                observer.next(JSON.parse(message.data));
              } catch (error) {
                observer.error(error);
              }
            };

            source.onerror = function (error) {
              observer.error(error);
            };

            return function () {
              observer.complete();
            };
          }).finally(function () {
            source.close();
            delete _this9._liveStream;
          });
        })();
      }

      return this._liveStream;
    }
  }]);

  return NetworkStore;
}();

exports.default = NetworkStore;
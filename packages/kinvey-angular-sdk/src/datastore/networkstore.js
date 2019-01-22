"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRequest = createRequest;
exports.NetworkStore = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _rxjs = require("rxjs");

var _config = require("../kinvey/config");

var _device = require("../kinvey/device");

var _session = require("../session");

var _aggregation = _interopRequireDefault(require("../aggregation"));

var Live = _interopRequireWildcard(require("../live"));

var _query = _interopRequireDefault(require("../query"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var NAMESPACE = 'appdata';

function createRequest(method, url, body) {
  return new _request.KinveyRequest({
    method: method,
    auth: _auth.Auth.Session,
    url: url,
    body: body
  });
}

var NetworkStore =
/*#__PURE__*/
function () {
  function NetworkStore(collectionName) {
    (0, _classCallCheck2.default)(this, NetworkStore);
    this.collectionName = collectionName;
  }
  /**
   * @deprecated 4.0.0 - Use collectionName instead.
   */


  (0, _createClass2.default)(NetworkStore, [{
    key: "find",
    value: function find(query) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _rxjs.Observable.create(
      /*#__PURE__*/
      function () {
        var _ref = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(observer) {
          var _getConfig, apiProtocol, apiHost, _options$rawResponse, rawResponse, timeout, properties, trace, skipBL, kinveyFileTTL, kinveyFileTLS, queryObject, url, request, response;

          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;

                  if (!(query && !(query instanceof _query.default))) {
                    _context.next = 3;
                    break;
                  }

                  throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

                case 3:
                  _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost;
                  _options$rawResponse = options.rawResponse, rawResponse = _options$rawResponse === void 0 ? false : _options$rawResponse, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL, kinveyFileTTL = options.kinveyFileTTL, kinveyFileTLS = options.kinveyFileTLS;
                  queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {
                    kinveyfile_ttl: kinveyFileTTL,
                    kinveyfile_tls: kinveyFileTLS
                  });
                  url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, _this.pathname, queryObject);
                  request = createRequest(_request.RequestMethod.GET, url);
                  request.headers.customRequestProperties = properties;
                  request.timeout = timeout;
                  _context.next = 12;
                  return request.execute();

                case 12:
                  response = _context.sent;

                  if (rawResponse === true) {
                    observer.next(response);
                  } else {
                    observer.next(response.data);
                  }

                  observer.complete();
                  _context.next = 20;
                  break;

                case 17:
                  _context.prev = 17;
                  _context.t0 = _context["catch"](0);
                  observer.error(_context.t0);

                case 20:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[0, 17]]);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "count",
    value: function count(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _rxjs.Observable.create(
      /*#__PURE__*/
      function () {
        var _ref2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(observer) {
          var _getConfig2, apiProtocol, apiHost, _options$rawResponse2, rawResponse, timeout, properties, trace, skipBL, queryObject, url, request, response;

          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.prev = 0;

                  if (!(query && !(query instanceof _query.default))) {
                    _context2.next = 3;
                    break;
                  }

                  throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

                case 3:
                  _getConfig2 = (0, _config.get)(), apiProtocol = _getConfig2.apiProtocol, apiHost = _getConfig2.apiHost;
                  _options$rawResponse2 = options.rawResponse, rawResponse = _options$rawResponse2 === void 0 ? false : _options$rawResponse2, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                  queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
                  url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(_this2.pathname, "/_count"), queryObject);
                  request = createRequest(_request.RequestMethod.GET, url);
                  request.headers.customRequestProperties = properties;
                  request.timeout = timeout;
                  _context2.next = 12;
                  return request.execute();

                case 12:
                  response = _context2.sent;

                  if (rawResponse === true) {
                    observer.next(response);
                  } else {
                    observer.next(response.data.count);
                  }

                  observer.complete();
                  _context2.next = 20;
                  break;

                case 17:
                  _context2.prev = 17;
                  _context2.t0 = _context2["catch"](0);
                  observer.error(_context2.t0);

                case 20:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[0, 17]]);
        }));

        return function (_x2) {
          return _ref2.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "group",
    value: function group(aggregation) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _rxjs.Observable.create(
      /*#__PURE__*/
      function () {
        var _ref3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee3(observer) {
          var _getConfig3, apiProtocol, apiHost, _options$rawResponse3, rawResponse, timeout, properties, trace, skipBL, queryObject, url, request, response;

          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (aggregation instanceof _aggregation.default) {
                    _context3.next = 3;
                    break;
                  }

                  throw new _kinvey.default('Invalid aggregation. It must be an instance of the Aggregation class.');

                case 3:
                  _getConfig3 = (0, _config.get)(), apiProtocol = _getConfig3.apiProtocol, apiHost = _getConfig3.apiHost;
                  _options$rawResponse3 = options.rawResponse, rawResponse = _options$rawResponse3 === void 0 ? false : _options$rawResponse3, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                  queryObject = {};
                  url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(_this3.pathname, "/_group"), queryObject);
                  request = createRequest(_request.RequestMethod.POST, url, aggregation.toPlainObject());
                  request.headers.customRequestProperties = properties;
                  request.timeout = timeout;
                  _context3.next = 12;
                  return request.execute();

                case 12:
                  response = _context3.sent;

                  if (rawResponse === true) {
                    observer.next(response);
                  } else {
                    observer.next(response.data);
                  }

                  observer.complete();
                  _context3.next = 20;
                  break;

                case 17:
                  _context3.prev = 17;
                  _context3.t0 = _context3["catch"](0);
                  observer.error(_context3.t0);

                case 20:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this, [[0, 17]]);
        }));

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "findById",
    value: function findById(id) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var stream = _rxjs.Observable.create(
      /*#__PURE__*/
      function () {
        var _ref4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee4(observer) {
          var _getConfig4, apiProtocol, apiHost, _options$rawResponse4, rawResponse, timeout, properties, trace, skipBL, kinveyFileTTL, kinveyFileTLS, queryObject, url, request, response;

          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.prev = 0;

                  if (!id) {
                    _context4.next = 15;
                    break;
                  }

                  _getConfig4 = (0, _config.get)(), apiProtocol = _getConfig4.apiProtocol, apiHost = _getConfig4.apiHost;
                  _options$rawResponse4 = options.rawResponse, rawResponse = _options$rawResponse4 === void 0 ? false : _options$rawResponse4, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL, kinveyFileTTL = options.kinveyFileTTL, kinveyFileTLS = options.kinveyFileTLS;
                  queryObject = {
                    kinveyfile_ttl: kinveyFileTTL,
                    kinveyfile_tls: kinveyFileTLS
                  };
                  url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(_this4.pathname, "/").concat(id), queryObject);
                  request = createRequest(_request.RequestMethod.GET, url);
                  request.headers.customRequestProperties = properties;
                  request.timeout = timeout;
                  _context4.next = 11;
                  return request.execute();

                case 11:
                  response = _context4.sent;

                  if (rawResponse === true) {
                    observer.next(response);
                  } else {
                    observer.next(response.data);
                  }

                  _context4.next = 16;
                  break;

                case 15:
                  observer.next(undefined);

                case 16:
                  observer.complete();
                  _context4.next = 22;
                  break;

                case 19:
                  _context4.prev = 19;
                  _context4.t0 = _context4["catch"](0);
                  observer.error(_context4.t0);

                case 22:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this, [[0, 19]]);
        }));

        return function (_x4) {
          return _ref4.apply(this, arguments);
        };
      }());

      return stream;
    }
  }, {
    key: "create",
    value: function () {
      var _create = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(doc) {
        var options,
            _getConfig5,
            apiProtocol,
            apiHost,
            _options$rawResponse5,
            rawResponse,
            timeout,
            properties,
            trace,
            skipBL,
            queryObject,
            url,
            request,
            response,
            _args5 = arguments;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                options = _args5.length > 1 && _args5[1] !== undefined ? _args5[1] : {};

                if (!(0, _isArray.default)(doc)) {
                  _context5.next = 3;
                  break;
                }

                throw new _kinvey.default('Unable to create an array of entities.', 'Please create entities one by one.');

              case 3:
                _getConfig5 = (0, _config.get)(), apiProtocol = _getConfig5.apiProtocol, apiHost = _getConfig5.apiHost;
                _options$rawResponse5 = options.rawResponse, rawResponse = _options$rawResponse5 === void 0 ? false : _options$rawResponse5, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                queryObject = {};
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, this.pathname, queryObject);
                request = createRequest(_request.RequestMethod.POST, url, doc);
                request.headers.customRequestProperties = properties;
                request.timeout = timeout;
                _context5.next = 12;
                return request.execute();

              case 12:
                response = _context5.sent;

                if (!(rawResponse === true)) {
                  _context5.next = 15;
                  break;
                }

                return _context5.abrupt("return", response);

              case 15:
                return _context5.abrupt("return", response.data);

              case 16:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function create(_x5) {
        return _create.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: "update",
    value: function () {
      var _update = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee6(doc) {
        var options,
            _getConfig6,
            apiProtocol,
            apiHost,
            _options$rawResponse6,
            rawResponse,
            timeout,
            properties,
            trace,
            skipBL,
            queryObject,
            url,
            request,
            response,
            _args6 = arguments;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                options = _args6.length > 1 && _args6[1] !== undefined ? _args6[1] : {};

                if (!(0, _isArray.default)(doc)) {
                  _context6.next = 3;
                  break;
                }

                throw new _kinvey.default('Unable to update an array of entities.', 'Please update entities one by one.');

              case 3:
                if (doc._id) {
                  _context6.next = 5;
                  break;
                }

                throw new _kinvey.default('The entity provided does not contain an _id. An _id is required to update the entity.', doc);

              case 5:
                _getConfig6 = (0, _config.get)(), apiProtocol = _getConfig6.apiProtocol, apiHost = _getConfig6.apiHost;
                _options$rawResponse6 = options.rawResponse, rawResponse = _options$rawResponse6 === void 0 ? false : _options$rawResponse6, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                queryObject = {};
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(this.pathname, "/").concat(doc._id), queryObject);
                request = createRequest(_request.RequestMethod.PUT, url, doc);
                request.headers.customRequestProperties = properties;
                request.timeout = timeout;
                _context6.next = 14;
                return request.execute();

              case 14:
                response = _context6.sent;

                if (!(rawResponse === true)) {
                  _context6.next = 17;
                  break;
                }

                return _context6.abrupt("return", response);

              case 17:
                return _context6.abrupt("return", response.data);

              case 18:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function update(_x6) {
        return _update.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: "save",
    value: function save(doc, options) {
      if (doc._id) {
        return this.update(doc, options);
      }

      return this.create(doc, options);
    }
  }, {
    key: "remove",
    value: function () {
      var _remove = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee7(query) {
        var options,
            _getConfig7,
            apiProtocol,
            apiHost,
            _options$rawResponse7,
            rawResponse,
            timeout,
            properties,
            trace,
            skipBL,
            queryObject,
            url,
            request,
            response,
            _args7 = arguments;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                options = _args7.length > 1 && _args7[1] !== undefined ? _args7[1] : {};

                if (!(query && !(query instanceof _query.default))) {
                  _context7.next = 3;
                  break;
                }

                throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

              case 3:
                _getConfig7 = (0, _config.get)(), apiProtocol = _getConfig7.apiProtocol, apiHost = _getConfig7.apiHost;
                _options$rawResponse7 = options.rawResponse, rawResponse = _options$rawResponse7 === void 0 ? false : _options$rawResponse7, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                queryObject = Object.assign({}, query ? query.toQueryObject() : {}, {});
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, this.pathname, queryObject);
                request = createRequest(_request.RequestMethod.DELETE, url);
                request.headers.customRequestProperties = properties;
                request.timeout = timeout;
                _context7.next = 12;
                return request.execute();

              case 12:
                response = _context7.sent;

                if (!(rawResponse === true)) {
                  _context7.next = 15;
                  break;
                }

                return _context7.abrupt("return", response);

              case 15:
                return _context7.abrupt("return", response.data);

              case 16:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function remove(_x7) {
        return _remove.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: "removeById",
    value: function () {
      var _removeById = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee8(id) {
        var options,
            _getConfig8,
            apiProtocol,
            apiHost,
            _options$rawResponse8,
            rawResponse,
            timeout,
            properties,
            trace,
            skipBL,
            queryObject,
            url,
            request,
            response,
            _args8 = arguments;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                options = _args8.length > 1 && _args8[1] !== undefined ? _args8[1] : {};
                _getConfig8 = (0, _config.get)(), apiProtocol = _getConfig8.apiProtocol, apiHost = _getConfig8.apiHost;
                _options$rawResponse8 = options.rawResponse, rawResponse = _options$rawResponse8 === void 0 ? false : _options$rawResponse8, timeout = options.timeout, properties = options.properties, trace = options.trace, skipBL = options.skipBL;
                queryObject = {};
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(this.pathname, "/").concat(id), queryObject);
                request = createRequest(_request.RequestMethod.DELETE, url);
                request.headers.customRequestProperties = properties;
                request.timeout = timeout;
                _context8.next = 10;
                return request.execute();

              case 10:
                response = _context8.sent;

                if (!(rawResponse === true)) {
                  _context8.next = 13;
                  break;
                }

                return _context8.abrupt("return", response);

              case 13:
                return _context8.abrupt("return", response.data);

              case 14:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function removeById(_x8) {
        return _removeById.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: "subscribe",
    value: function () {
      var _subscribe = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee9(receiver) {
        var _getConfig9, apiProtocol, apiHost, deviceId, request;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (Live.isRegistered()) {
                  _context9.next = 2;
                  break;
                }

                throw new _kinvey.default('Please call Kinvey.User.registerForLiveService() before you subscribe for to the collection.');

              case 2:
                _getConfig9 = (0, _config.get)(), apiProtocol = _getConfig9.apiProtocol, apiHost = _getConfig9.apiHost;
                deviceId = (0, _device.getId)();
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(this.pathname, "/_subscribe")),
                  body: {
                    deviceId: deviceId
                  }
                });
                _context9.next = 7;
                return request.execute();

              case 7:
                Live.subscribeToChannel(this.channelName, receiver);
                Live.subscribeToChannel(this.personalChannelName, receiver);
                return _context9.abrupt("return", this);

              case 10:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function subscribe(_x9) {
        return _subscribe.apply(this, arguments);
      }

      return subscribe;
    }()
  }, {
    key: "unsubscribe",
    value: function () {
      var _unsubscribe = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee10() {
        var _getConfig10, apiProtocol, apiHost, deviceId, request;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _getConfig10 = (0, _config.get)(), apiProtocol = _getConfig10.apiProtocol, apiHost = _getConfig10.apiHost;
                deviceId = (0, _device.getId)();
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "".concat(this.pathname, "/_unsubscribe")),
                  body: {
                    deviceId: deviceId
                  }
                });
                _context10.next = 5;
                return request.execute();

              case 5:
                Live.unsubscribeFromChannel(this.channelName);
                Live.unsubscribeFromChannel(this.personalChannelName);
                return _context10.abrupt("return", this);

              case 8:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function unsubscribe() {
        return _unsubscribe.apply(this, arguments);
      }

      return unsubscribe;
    }()
  }, {
    key: "collection",
    get: function get() {
      return this.collectionName;
    }
  }, {
    key: "pathname",
    get: function get() {
      var _getConfig11 = (0, _config.get)(),
          appKey = _getConfig11.appKey;

      return "/".concat(NAMESPACE, "/").concat(appKey, "/").concat(this.collectionName);
    }
  }, {
    key: "channelName",
    get: function get() {
      var _getConfig12 = (0, _config.get)(),
          appKey = _getConfig12.appKey;

      return "".concat(appKey, ".c-").concat(this.collectionName);
    }
  }, {
    key: "personalChannelName",
    get: function get() {
      var session = (0, _session.get)();
      return "".concat(this.channelName, ".u-").concat(session._id);
    }
  }]);
  return NetworkStore;
}();

exports.NetworkStore = NetworkStore;
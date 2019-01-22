"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Request = exports.RequestMethod = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _pQueue = _interopRequireDefault(require("p-queue"));

var _jsBase = require("js-base64");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _invalidCredentials = _interopRequireDefault(require("../errors/invalidCredentials"));

var _config = require("../kinvey/config");

var _session = require("../session");

var _cache = require("../cache");

var _headers = require("./headers");

var _utils = require("./utils");

var _response2 = _interopRequireDefault(require("./response"));

var _auth = require("./auth");

var _http = _interopRequireDefault(require("./http"));

var REQUEST_QUEUE = new _pQueue.default();
var refreshTokenRequestInProgress = false;
var AUTHORIZATION_HEADER = 'Authorization';
var RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
exports.RequestMethod = RequestMethod;
var KINVEY_DEVICE_INFORMATION_HEADER = 'X-Kinvey-Device-Information';
var deviceInformation;
var KINVEY_DEVICE_INFO_HEADER = 'X-Kinvey-Device-Info';
var deviceInfo;

var Request =
/*#__PURE__*/
function () {
  function Request() {
    var request = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2.default)(this, Request);
    var headers = request.headers,
        method = request.method,
        url = request.url,
        body = request.body,
        timeout = request.timeout;
    this.headers = headers;
    this.method = method;
    this.url = url;
    this.body = body;
    this.timeout = timeout;
  }

  (0, _createClass2.default)(Request, [{
    key: "execute",
    value: function () {
      var _execute = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee() {
        var responseObject, response;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _http.default)({
                  headers: this.headers.toObject(),
                  method: this.method,
                  url: this.url,
                  body: (0, _utils.serialize)(this.headers.contentType, this.body),
                  timeout: this.timeout
                });

              case 2:
                responseObject = _context.sent;
                // Create a response
                response = new _response2.default({
                  statusCode: responseObject.statusCode,
                  headers: responseObject.headers,
                  data: responseObject.data
                }); // Return the response if it was successful

                if (!response.isSuccess()) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt("return", response);

              case 6:
                throw response.error;

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function execute() {
        return _execute.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: "headers",
    get: function get() {
      return this._headers;
    },
    set: function set(headers) {
      this._headers = new _headers.Headers(headers);
    }
  }, {
    key: "timeout",
    get: function get() {
      return this._timeout;
    },
    set: function set(timeout) {
      var _getConfig = (0, _config.get)(),
          defaultTimeout = _getConfig.defaultTimeout;

      var requestTimeout = typeof timeout === 'undefined' || timeout === null ? defaultTimeout : timeout;

      if (!(0, _isNumber.default)(requestTimeout) || isNaN(requestTimeout)) {
        throw new _kinvey.default('Invalid timeout. Timeout must be a number.');
      }

      this._timeout = requestTimeout;
    }
  }]);
  return Request;
}();

exports.Request = Request;

function isRefreshTokenRequestInProgress() {
  return refreshTokenRequestInProgress === true;
}

var KinveyRequest =
/*#__PURE__*/
function (_Request) {
  (0, _inherits2.default)(KinveyRequest, _Request);

  function KinveyRequest(request) {
    var _this;

    (0, _classCallCheck2.default)(this, KinveyRequest);
    _this = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(KinveyRequest).call(this, request));
    _this.headers = request.headers;
    _this.auth = request.auth;
    return _this;
  }

  (0, _createClass2.default)(KinveyRequest, [{
    key: "execute",
    value: function () {
      var _execute2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2() {
        var _this2 = this;

        var retry,
            response,
            _getConfig2,
            appKey,
            appSecret,
            authProtocol,
            authHost,
            apiProtocol,
            apiHost,
            activeSession,
            socialIdentity,
            micIdentityKey,
            micIdentity,
            refreshRequest,
            refreshResponse,
            newMicIdentity,
            loginRequest,
            loginResponse,
            newSession,
            _response,
            url,
            request,
            _args2 = arguments;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                retry = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : true;
                _context2.prev = 1;

                // Add the X-Kinvey-Device-Information header
                if (deviceInformation) {
                  this.headers.set(KINVEY_DEVICE_INFORMATION_HEADER, deviceInformation);
                } // Add the X-Kinvey-Device-Info header


                if (deviceInfo) {
                  this.headers.set(KINVEY_DEVICE_INFO_HEADER, JSON.stringify(deviceInfo));
                } // Set the authorization header


                if (this.auth) {
                  this.headers.set(AUTHORIZATION_HEADER, this.authorizationHeader);
                } // Execute the request


                _context2.next = 7;
                return (0, _get2.default)((0, _getPrototypeOf2.default)(KinveyRequest.prototype), "execute", this).call(this);

              case 7:
                response = _context2.sent;
                return _context2.abrupt("return", response);

              case 11:
                _context2.prev = 11;
                _context2.t0 = _context2["catch"](1);

                if (!retry) {
                  _context2.next = 61;
                  break;
                }

                if (!(_context2.t0 instanceof _invalidCredentials.default)) {
                  _context2.next = 59;
                  break;
                }

                if (!isRefreshTokenRequestInProgress()) {
                  _context2.next = 17;
                  break;
                }

                return _context2.abrupt("return", REQUEST_QUEUE.add(function () {
                  return _this2.execute(false).catch(function () {
                    return Promise.reject(_context2.t0);
                  });
                }));

              case 17:
                _getConfig2 = (0, _config.get)(), appKey = _getConfig2.appKey, appSecret = _getConfig2.appSecret, authProtocol = _getConfig2.authProtocol, authHost = _getConfig2.authHost, apiProtocol = _getConfig2.apiProtocol, apiHost = _getConfig2.apiHost;
                activeSession = (0, _session.get)();
                socialIdentity = activeSession && activeSession._socialIdentity || {};
                micIdentityKey = Object.keys(socialIdentity).find(function (sessionKey) {
                  return socialIdentity[sessionKey].identity === 'kinveyAuth';
                });
                micIdentity = socialIdentity[micIdentityKey];

                if (!(micIdentity && micIdentity.refresh_token && micIdentity.redirect_uri)) {
                  _context2.next = 48;
                  break;
                }

                _context2.prev = 23;
                // Pause the request queue
                REQUEST_QUEUE.pause();
                refreshTokenRequestInProgress = true; // Refresh the session

                refreshRequest = new KinveyRequest({
                  method: RequestMethod.POST,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: function Authorization() {
                      var credentials = _jsBase.Base64.encode("".concat(micIdentity.client_id, ":").concat(appSecret));

                      return "Basic ".concat(credentials);
                    }
                  },
                  url: (0, _utils.formatKinveyUrl)(authProtocol, authHost, '/oauth/token'),
                  body: {
                    grant_type: 'refresh_token',
                    client_id: micIdentity.client_id,
                    redirect_uri: micIdentity.redirect_uri,
                    refresh_token: micIdentity.refresh_token
                  }
                });
                _context2.next = 29;
                return refreshRequest.execute();

              case 29:
                refreshResponse = _context2.sent;
                // Create a new session
                newMicIdentity = Object.assign({}, refreshResponse.data, {
                  client_id: micIdentity.client_id,
                  redirect_uri: micIdentity.redirect_uri,
                  protocol: authProtocol,
                  host: authHost
                }); // Login the new MIC identity

                loginRequest = new KinveyRequest({
                  method: RequestMethod.POST,
                  auth: _auth.Auth.App,
                  url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/user/".concat(appKey, "/login")),
                  properties: this.properties,
                  body: {
                    _socialIdentity: (0, _defineProperty2.default)({}, micIdentityKey, newMicIdentity)
                  }
                });
                _context2.next = 34;
                return loginRequest.execute();

              case 34:
                loginResponse = _context2.sent;
                newSession = loginResponse.data;
                newSession._socialIdentity[micIdentityKey] = Object.assign({}, newSession._socialIdentity[micIdentityKey], newMicIdentity); // Set the new session

                (0, _session.set)(newSession); // Redo the original request

                _context2.next = 40;
                return this.execute(false);

              case 40:
                _response = _context2.sent;
                // Start the request queue
                refreshTokenRequestInProgress = false;
                REQUEST_QUEUE.start(); // Return the response

                return _context2.abrupt("return", _response);

              case 46:
                _context2.prev = 46;
                _context2.t1 = _context2["catch"](23);

              case 48:
                _context2.prev = 48;
                // TODO: Unregister from live service
                // Logout
                url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/user/".concat(appKey, "/_logout"));
                request = new KinveyRequest({
                  method: RequestMethod.POST,
                  auth: _auth.Auth.Session,
                  url: url
                });
                _context2.next = 53;
                return request.execute(false);

              case 53:
                // Remove the session
                (0, _session.remove)(); // Clear data

                (0, _cache.clear)(appKey);
                _context2.next = 59;
                break;

              case 57:
                _context2.prev = 57;
                _context2.t2 = _context2["catch"](48);

              case 59:
                // Start the request queue
                refreshTokenRequestInProgress = false;
                REQUEST_QUEUE.start();

              case 61:
                throw _context2.t0;

              case 62:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 11], [23, 46], [48, 57]]);
      }));

      function execute() {
        return _execute2.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: "headers",
    get: function get() {
      return this._headers;
    },
    set: function set(headers) {
      this._headers = new _headers.KinveyHeaders(headers);
    }
  }, {
    key: "authorizationHeader",
    get: function get() {
      var _getConfig3 = (0, _config.get)(),
          appKey = _getConfig3.appKey,
          appSecret = _getConfig3.appSecret,
          masterSecret = _getConfig3.masterSecret;

      var session = (0, _session.get)();

      if (this.auth === _auth.Auth.App) {
        return (0, _auth.app)(appKey, appSecret);
      } else if (this.auth === _auth.Auth.Master) {
        return (0, _auth.master)(appKey, masterSecret);
      } else if (this.auth === _auth.Auth.Session) {
        return (0, _auth.session)(session);
      } else if (this.auth === _auth.Auth.Basic) {
        return (0, _auth.basic)(appKey, appSecret, masterSecret);
      } else if (this.auth === _auth.Auth.Default) {
        return (0, _auth.defaultAuth)(session, appKey, masterSecret);
      } else if (this.auth === _auth.Auth.All) {
        return (0, _auth.all)(session, appKey, appSecret, masterSecret);
      }

      return null;
    }
  }]);
  return KinveyRequest;
}(Request);

exports.KinveyRequest = KinveyRequest;
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loginWithRedirectUri = loginWithRedirectUri;
exports.loginWithUsernamePassword = loginWithUsernamePassword;
exports.IDENTITY = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _urlJoin = _interopRequireDefault(require("url-join"));

var _url = require("url");

var _jsBase = require("js-base64");

var _config = require("../kinvey/config");

var _utils = require("../http/utils");

var _request = require("../http/request");

var _popup = _interopRequireDefault(require("./popup"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var IDENTITY = 'kinveyAuth';
exports.IDENTITY = IDENTITY;

function getVersion() {
  var version = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3;
  return String(version).indexOf('v') === 0 ? version : "v".concat(version);
}

function loginWithPopup(clientId, redirectUri, version) {
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(resolve, reject) {
      var _getConfig, authProtocol, authHost, query, url, popup, redirected;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _getConfig = (0, _config.get)(), authProtocol = _getConfig.authProtocol, authHost = _getConfig.authHost;
              query = {
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid'
              };
              url = (0, _utils.formatKinveyUrl)(authProtocol, authHost, (0, _urlJoin.default)(getVersion(version), '/oauth/auth'), query);
              popup = (0, _popup.default)(url);
              redirected = false;
              popup.onLoaded(function (event) {
                try {
                  if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
                    var parsedUrl = (0, _url.parse)(event.url, true); // eslint-disable-next-line camelcase

                    var _ref2 = parsedUrl.query || {},
                        code = _ref2.code,
                        error = _ref2.error,
                        error_description = _ref2.error_description;

                    redirected = true;
                    popup.removeAllListeners();
                    popup.close();

                    if (code) {
                      resolve(code);
                    } else if (error) {
                      reject(new _kinvey.default(error, error_description));
                    } else {
                      reject(new _kinvey.default('No code or error was provided.'));
                    }
                  }
                } catch (error) {// Just catch the error
                }
              });
              popup.onClosed(function () {
                if (!redirected) {
                  popup.removeAllListeners();
                  reject(new _kinvey.default('Login has been cancelled.'));
                }
              });

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());
}

function getTokenWithCode(_x3, _x4, _x5) {
  return _getTokenWithCode.apply(this, arguments);
}

function _getTokenWithCode() {
  _getTokenWithCode = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(code, clientId, redirectUri) {
    var options,
        _getConfig2,
        authProtocol,
        authHost,
        request,
        response,
        token,
        _args2 = arguments;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            options = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : {};
            _getConfig2 = (0, _config.get)(), authProtocol = _getConfig2.authProtocol, authHost = _getConfig2.authHost;
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.POST,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: function Authorization() {
                  var _getConfig3 = (0, _config.get)(),
                      appSecret = _getConfig3.appSecret;

                  var credentials = _jsBase.Base64.encode("".concat(clientId, ":").concat(appSecret));

                  return "Basic ".concat(credentials);
                }
              },
              url: (0, _utils.formatKinveyUrl)(authProtocol, authHost, '/oauth/token'),
              body: {
                grant_type: 'authorization_code',
                client_id: clientId,
                redirect_uri: redirectUri,
                code: code
              },
              timeout: options.timeout
            });
            _context2.next = 5;
            return request.execute();

          case 5:
            response = _context2.sent;
            token = response.data;
            return _context2.abrupt("return", Object.assign({}, {
              identity: IDENTITY,
              client_id: clientId,
              redirect_uri: redirectUri,
              protocol: authProtocol,
              host: authHost
            }, token));

          case 8:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _getTokenWithCode.apply(this, arguments);
}

function getTokenWithUsernamePassword(_x6, _x7, _x8) {
  return _getTokenWithUsernamePassword.apply(this, arguments);
}

function _getTokenWithUsernamePassword() {
  _getTokenWithUsernamePassword = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(username, password, clientId) {
    var options,
        _getConfig4,
        authProtocol,
        authHost,
        request,
        response,
        token,
        _args3 = arguments;

    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            options = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : {};
            _getConfig4 = (0, _config.get)(), authProtocol = _getConfig4.authProtocol, authHost = _getConfig4.authHost;
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.POST,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: function Authorization() {
                  var _getConfig5 = (0, _config.get)(),
                      appSecret = _getConfig5.appSecret;

                  var credentials = _jsBase.Base64.encode("".concat(clientId, ":").concat(appSecret));

                  return "Basic ".concat(credentials);
                }
              },
              url: (0, _utils.formatKinveyUrl)(authProtocol, authHost, '/oauth/token'),
              body: {
                grant_type: 'password',
                username: username,
                password: password
              },
              timeout: options.timeout
            });
            _context3.next = 5;
            return request.execute();

          case 5:
            response = _context3.sent;
            token = response.data;
            return _context3.abrupt("return", Object.assign({}, {
              identity: IDENTITY,
              client_id: clientId,
              protocol: authProtocol,
              host: authHost
            }, token));

          case 8:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _getTokenWithUsernamePassword.apply(this, arguments);
}

function loginWithRedirectUri(_x9) {
  return _loginWithRedirectUri.apply(this, arguments);
}

function _loginWithRedirectUri() {
  _loginWithRedirectUri = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(redirectUri) {
    var options,
        _getConfig6,
        appKey,
        micId,
        version,
        clientId,
        code,
        token,
        _args4 = arguments;

    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            options = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : {};
            _getConfig6 = (0, _config.get)(), appKey = _getConfig6.appKey;
            micId = options.micId, version = options.version;
            clientId = appKey;

            if ((0, _isString.default)(redirectUri)) {
              _context4.next = 6;
              break;
            }

            throw new _kinvey.default('A redirectUri is required and must be a string.');

          case 6:
            if ((0, _isString.default)(micId)) {
              clientId = "".concat(clientId, ".").concat(micId);
            }

            _context4.next = 9;
            return loginWithPopup(clientId, redirectUri, version);

          case 9:
            code = _context4.sent;
            _context4.next = 12;
            return getTokenWithCode(code, clientId, redirectUri, options);

          case 12:
            token = _context4.sent;
            return _context4.abrupt("return", token);

          case 14:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return _loginWithRedirectUri.apply(this, arguments);
}

function loginWithUsernamePassword(_x10, _x11) {
  return _loginWithUsernamePassword.apply(this, arguments);
}

function _loginWithUsernamePassword() {
  _loginWithUsernamePassword = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(username, password) {
    var options,
        _getConfig7,
        appKey,
        micId,
        clientId,
        token,
        _args5 = arguments;

    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            options = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : {};
            _getConfig7 = (0, _config.get)(), appKey = _getConfig7.appKey;
            micId = options.micId;
            clientId = appKey;

            if (!(!(0, _isString.default)(username) || !(0, _isString.default)(password))) {
              _context5.next = 6;
              break;
            }

            throw new _kinvey.default('A username and password are required and must be a string.');

          case 6:
            if ((0, _isString.default)(micId)) {
              clientId = "".concat(clientId, ".").concat(micId);
            }

            _context5.next = 9;
            return getTokenWithUsernamePassword(username, password, clientId, options);

          case 9:
            token = _context5.sent;
            return _context5.abrupt("return", token);

          case 11:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return _loginWithUsernamePassword.apply(this, arguments);
}
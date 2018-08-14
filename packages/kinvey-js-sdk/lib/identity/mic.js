'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = exports.AuthorizationGrant = exports.IDENTITY = undefined;

var getTempLoginUrl = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(clientId, redirectUri, version) {
    var _getConfig, appSecret, url, headers, authorizationHeader, request, response;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _getConfig = (0, _client.getConfig)(), appSecret = _getConfig.appSecret;
            url = (0, _http.formatKinveyAuthUrl)((0, _urlJoin2.default)('v' + version, '/oauth/auth'));
            headers = new _http.Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
            authorizationHeader = (0, _http.getKinveyClientAuthorizationHeader)(clientId, appSecret);

            headers.set(authorizationHeader.name, authorizationHeader.value);
            request = new _http.Request({
              method: _http.RequestMethod.POST,
              headers: headers,
              url: url,
              body: {
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code'
              }
            });
            _context.next = 8;
            return (0, _http.execute)(request);

          case 8:
            response = _context.sent;
            return _context.abrupt('return', response.data);

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getTempLoginUrl(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var loginWithUrl = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(url, username, password, clientId, redirectUri) {
    var _getConfig2, appSecret, headers, authorizationHeader, request, response, location, parsedLocation, query;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _getConfig2 = (0, _client.getConfig)(), appSecret = _getConfig2.appSecret;
            headers = new _http.Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
            authorizationHeader = (0, _http.getKinveyClientAuthorizationHeader)(clientId, appSecret);

            headers.set(authorizationHeader.name, authorizationHeader.value);
            request = new _http.Request({
              method: _http.RequestMethod.POST,
              headers: headers,
              url: url,
              body: {
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                username: username,
                password: password,
                scope: 'openid'
              }
            });
            _context3.next = 7;
            return (0, _http.execute)(request);

          case 7:
            response = _context3.sent;
            location = response.headers.get('location');
            parsedLocation = (0, _url.parse)(location, true) || {};
            query = parsedLocation.query || {};
            return _context3.abrupt('return', query.code);

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function loginWithUrl(_x6, _x7, _x8, _x9, _x10) {
    return _ref4.apply(this, arguments);
  };
}();

var getTokenWithCode = function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(code, clientId, redirectUri) {
    var _getConfig3, appSecret, url, headers, authorizationHeader, request, response;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _getConfig3 = (0, _client.getConfig)(), appSecret = _getConfig3.appSecret;
            url = (0, _http.formatKinveyAuthUrl)('/oauth/token');
            headers = new _http.Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
            authorizationHeader = (0, _http.getKinveyClientAuthorizationHeader)(clientId, appSecret);

            headers.set(authorizationHeader.name, authorizationHeader.value);
            request = new _http.Request({
              method: _http.RequestMethod.POST,
              headers: headers,
              url: url,
              body: {
                grant_type: 'authorization_code',
                client_id: clientId,
                redirect_uri: redirectUri,
                code: code
              }
            });
            _context4.next = 8;
            return (0, _http.execute)(request);

          case 8:
            response = _context4.sent;
            return _context4.abrupt('return', response.data);

          case 10:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getTokenWithCode(_x11, _x12, _x13) {
    return _ref5.apply(this, arguments);
  };
}();

var login = exports.login = function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(redirectUri) {
    var authorizationGrant = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : AuthorizationGrant.AuthorizationCodeLoginPage;
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var _getConfig4, appKey, micId, version, username, password, clientId, code, url, token;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _getConfig4 = (0, _client.getConfig)(), appKey = _getConfig4.appKey;
            micId = options.micId, version = options.version, username = options.username, password = options.password;
            clientId = appKey;
            code = void 0;

            if ((0, _isString2.default)(redirectUri)) {
              _context5.next = 6;
              break;
            }

            return _context5.abrupt('return', Promise.reject(new Error('A redirectUri is required and must be a string.')));

          case 6:

            if ((0, _isString2.default)(micId)) {
              clientId = clientId + '.' + micId;
            }

            if (!(authorizationGrant === AuthorizationGrant.AuthorizationCodeAPI)) {
              _context5.next = 16;
              break;
            }

            _context5.next = 10;
            return getTempLoginUrl(clientId, redirectUri, version);

          case 10:
            url = _context5.sent;
            _context5.next = 13;
            return loginWithUrl(url, username, password, clientId, redirectUri);

          case 13:
            code = _context5.sent;
            _context5.next = 19;
            break;

          case 16:
            _context5.next = 18;
            return loginWithPopup(clientId, redirectUri, version);

          case 18:
            code = _context5.sent;

          case 19:
            _context5.next = 21;
            return getTokenWithCode(code, clientId, redirectUri);

          case 21:
            token = _context5.sent;
            return _context5.abrupt('return', token);

          case 23:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function login(_x16) {
    return _ref6.apply(this, arguments);
  };
}();

exports.use = use;

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _urlJoin = require('url-join');

var _urlJoin2 = _interopRequireDefault(_urlJoin);

var _url = require('url');

var _client = require('../client');

var _http = require('../http');

var _popup = require('./popup');

var CorePopup = _interopRequireWildcard(_popup);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var IDENTITY = exports.IDENTITY = 'kinveyAuth';

/**
 * @private
 */
var Popup = CorePopup;

/**
 * @private
 */
function use(CustomPopup) {
  Popup = CustomPopup;
}

/**
 * Enum for Mobile Identity Connect authorization grants.
 * @property  {string}    AuthorizationCodeLoginPage   AuthorizationCodeLoginPage grant
 * @property  {string}    AuthorizationCodeAPI         AuthorizationCodeAPI grant
 */
var AuthorizationGrant = exports.AuthorizationGrant = {
  AuthorizationCodeLoginPage: 'AuthorizationCodeLoginPage',
  AuthorizationCodeAPI: 'AuthorizationCodeAPI'
};
Object.freeze(AuthorizationGrant);

function loginWithPopup(clientId, redirectUri, version) {
  var _this = this;

  return new Promise(function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(resolve, reject) {
      var query, url, popup, redirected;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              query = {
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid'
              };
              url = (0, _http.formatKinveyAuthUrl)((0, _urlJoin2.default)('v' + version, '/oauth/auth'), query);
              _context2.next = 4;
              return Popup.open(url);

            case 4:
              popup = _context2.sent;
              redirected = false;


              popup.on('load', function (event) {
                try {
                  if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
                    var parsedUrl = url.parse(event.url, true);
                    // eslint-disable-next-line camelcase

                    var _ref3 = parsedUrl.query || {},
                        code = _ref3.code,
                        error = _ref3.error,
                        error_description = _ref3.error_description;

                    redirected = true;
                    popup.removeAllListeners();
                    popup.close();

                    if (code) {
                      resolve(code);
                    } else if (error) {
                      reject(new Error(error, error_description));
                    } else {
                      reject(new Error('No code or error was provided.'));
                    }
                  }
                } catch (error) {
                  // Just catch the error
                }
              });

              popup.on('close', function () {
                if (!redirected) {
                  popup.removeAllListeners();
                  reject(new Error('Login has been cancelled.'));
                }
              });

            case 8:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function (_x4, _x5) {
      return _ref2.apply(this, arguments);
    };
  }());
}
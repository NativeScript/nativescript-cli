"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = login;
exports.loginWithRedirectUri = loginWithRedirectUri;
exports.loginWithMIC = loginWithMIC;
exports.loginWithUsernamePassword = loginWithUsernamePassword;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _config = require("../kinvey/config");

var _activeUser = _interopRequireDefault(require("../errors/activeUser"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _notFound = _interopRequireDefault(require("../errors/notFound"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _session = require("../session");

var _user = require("./user");

var _utils2 = require("./utils");

var MIC = _interopRequireWildcard(require("./mic"));

var _signup = require("./signup");

var USER_NAMESPACE = 'user';

function login(_x, _x2) {
  return _login.apply(this, arguments);
}

function _login() {
  _login = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(username, password) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        activeUser,
        credentials,
        request,
        response,
        session,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            activeUser = (0, _user.getActiveUser)();
            credentials = username;

            if (!activeUser) {
              _context.next = 6;
              break;
            }

            throw new _activeUser.default('An active user already exists. Please logout the active user before you login.');

          case 6:
            if (!(0, _isPlainObject.default)(credentials)) {
              credentials = {
                username: username,
                password: password
              };
            }

            if (credentials.username) {
              credentials.username = String(credentials.username).trim();
            }

            if (credentials.password) {
              credentials.password = String(credentials.password).trim();
            }

            if (!((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity)) {
              _context.next = 11;
              break;
            }

            throw new _kinvey.default('Username and/or password missing. Please provide both a username and password to login.');

          case 11:
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.POST,
              auth: _auth.Auth.App,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/login")),
              body: credentials,
              timeout: options.timeout
            });
            _context.next = 14;
            return request.execute();

          case 14:
            response = _context.sent;
            session = response.data; // Remove sensitive data

            delete session.password; // Merge _socialIdentity

            if (credentials._socialIdentity) {
              session._socialIdentity = (0, _utils2.mergeSocialIdentity)(credentials._socialIdentity, session._socialIdentity);
            } // Store the active session


            (0, _session.set)(session); // Return the user

            return _context.abrupt("return", new _user.User(session));

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _login.apply(this, arguments);
}

function loginWithRedirectUri(_x3, _x4) {
  return _loginWithRedirectUri.apply(this, arguments);
}

function _loginWithRedirectUri() {
  _loginWithRedirectUri = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(redirectUri, options) {
    var activeUser, session, socialIdentity, credentials;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            activeUser = (0, _user.getActiveUser)();

            if (!activeUser) {
              _context2.next = 3;
              break;
            }

            throw new _activeUser.default('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');

          case 3:
            _context2.next = 5;
            return MIC.loginWithRedirectUri(redirectUri, options);

          case 5:
            session = _context2.sent;
            socialIdentity = {};
            socialIdentity[MIC.IDENTITY] = session;
            credentials = {
              _socialIdentity: socialIdentity
            };
            _context2.prev = 9;
            _context2.next = 12;
            return login(credentials);

          case 12:
            return _context2.abrupt("return", _context2.sent);

          case 15:
            _context2.prev = 15;
            _context2.t0 = _context2["catch"](9);

            if (!(_context2.t0 instanceof _notFound.default)) {
              _context2.next = 21;
              break;
            }

            _context2.next = 20;
            return (0, _signup.signup)(credentials);

          case 20:
            return _context2.abrupt("return", _context2.sent);

          case 21:
            throw _context2.t0;

          case 22:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[9, 15]]);
  }));
  return _loginWithRedirectUri.apply(this, arguments);
}

function loginWithMIC(_x5, _x6, _x7) {
  return _loginWithMIC.apply(this, arguments);
}

function _loginWithMIC() {
  _loginWithMIC = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(redirectUri, authorizationGrant, options) {
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", loginWithRedirectUri(redirectUri, options));

          case 1:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _loginWithMIC.apply(this, arguments);
}

function loginWithUsernamePassword(_x8, _x9, _x10) {
  return _loginWithUsernamePassword.apply(this, arguments);
}

function _loginWithUsernamePassword() {
  _loginWithUsernamePassword = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(username, password, options) {
    var activeUser, session, socialIdentity, credentials;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            activeUser = (0, _user.getActiveUser)();

            if (!activeUser) {
              _context4.next = 3;
              break;
            }

            throw new _activeUser.default('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');

          case 3:
            _context4.next = 5;
            return MIC.loginWithUsernamePassword(username, password, options);

          case 5:
            session = _context4.sent;
            socialIdentity = {};
            socialIdentity[MIC.IDENTITY] = session;
            credentials = {
              _socialIdentity: socialIdentity
            };
            _context4.prev = 9;
            _context4.next = 12;
            return login(credentials);

          case 12:
            return _context4.abrupt("return", _context4.sent);

          case 15:
            _context4.prev = 15;
            _context4.t0 = _context4["catch"](9);

            if (!(_context4.t0 instanceof _notFound.default)) {
              _context4.next = 21;
              break;
            }

            _context4.next = 20;
            return (0, _signup.signup)(credentials);

          case 20:
            return _context4.abrupt("return", _context4.sent);

          case 21:
            throw _context4.t0;

          case 22:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this, [[9, 15]]);
  }));
  return _loginWithUsernamePassword.apply(this, arguments);
}
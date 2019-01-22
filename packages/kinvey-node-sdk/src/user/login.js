"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = login;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _config = require("../kinvey/config");

var _activeUser = _interopRequireDefault(require("../errors/activeUser"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _session = require("../session");

var _getActiveUser = _interopRequireDefault(require("./getActiveUser"));

var _user = _interopRequireDefault(require("./user"));

var _utils2 = require("./utils");

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
            activeUser = (0, _getActiveUser.default)();
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

            return _context.abrupt("return", new _user.default(session));

          case 20:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _login.apply(this, arguments);
}
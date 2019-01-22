"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loginWithUsernamePassword;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _activeUser = _interopRequireDefault(require("../errors/activeUser"));

var _notFound = _interopRequireDefault(require("../errors/notFound"));

var _login = _interopRequireDefault(require("./login"));

var MIC = _interopRequireWildcard(require("./mic"));

var _signup = _interopRequireDefault(require("./signup"));

var _getActiveUser = _interopRequireDefault(require("./getActiveUser"));

function loginWithUsernamePassword(_x, _x2, _x3) {
  return _loginWithUsernamePassword.apply(this, arguments);
}

function _loginWithUsernamePassword() {
  _loginWithUsernamePassword = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(username, password, options) {
    var activeUser, session, socialIdentity, credentials;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            activeUser = (0, _getActiveUser.default)();

            if (!activeUser) {
              _context.next = 3;
              break;
            }

            throw new _activeUser.default('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');

          case 3:
            _context.next = 5;
            return MIC.loginWithUsernamePassword(username, password, options);

          case 5:
            session = _context.sent;
            socialIdentity = {};
            socialIdentity[MIC.IDENTITY] = session;
            credentials = {
              _socialIdentity: socialIdentity
            };
            _context.prev = 9;
            _context.next = 12;
            return (0, _login.default)(credentials);

          case 12:
            return _context.abrupt("return", _context.sent);

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](9);

            if (!(_context.t0 instanceof _notFound.default)) {
              _context.next = 21;
              break;
            }

            _context.next = 20;
            return (0, _signup.default)(credentials);

          case 20:
            return _context.abrupt("return", _context.sent);

          case 21:
            throw _context.t0;

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[9, 15]]);
  }));
  return _loginWithUsernamePassword.apply(this, arguments);
}
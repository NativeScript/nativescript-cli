"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signup = signup;
exports.signupWithIdentity = signupWithIdentity;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _config = require("../kinvey/config");

var _activeUser = _interopRequireDefault(require("../errors/activeUser"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _session = require("../session");

var _user = require("./user");

var USER_NAMESPACE = 'user';

function signup(_x) {
  return _signup.apply(this, arguments);
}

function _signup() {
  _signup = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(data) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        activeUser,
        _options$state,
        state,
        url,
        request,
        response,
        session,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            activeUser = (0, _user.getActiveUser)();
            _options$state = options.state, state = _options$state === void 0 ? true : _options$state;

            if (!(state === true && activeUser)) {
              _context.next = 6;
              break;
            }

            throw new _activeUser.default('An active user already exists. Please logout the active user before you signup.');

          case 6:
            url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey));
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.POST,
              auth: _auth.Auth.App,
              url: url,
              timeout: options.timeout
            });

            if (data instanceof _user.User) {
              request.body = (0, _isEmpty.default)(data.data) ? null : data.data;
            } else {
              request.body = (0, _isEmpty.default)(data) ? null : data;
            }

            _context.next = 11;
            return request.execute();

          case 11:
            response = _context.sent;
            session = response.data;

            if (state === true) {
              (0, _session.set)(session);
            }

            return _context.abrupt("return", new _user.User(session));

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _signup.apply(this, arguments);
}

function signupWithIdentity() {
  return _signupWithIdentity.apply(this, arguments);
}

function _signupWithIdentity() {
  _signupWithIdentity = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            throw new _kinvey.default('This function has been deprecated. You should use MIC to login instead.');

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _signupWithIdentity.apply(this, arguments);
}
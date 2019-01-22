"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = remove;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _config = require("../kinvey/config");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _getActiveUser = _interopRequireDefault(require("./getActiveUser"));

function remove(_x) {
  return _remove.apply(this, arguments);
}

function _remove() {
  _remove = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(id) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        hard,
        activeUser,
        url,
        request,
        response,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            hard = options.hard;
            activeUser = (0, _getActiveUser.default)();

            if (id) {
              _context.next = 6;
              break;
            }

            throw new _kinvey.default('An id was not provided.');

          case 6:
            if ((0, _isString.default)(id)) {
              _context.next = 8;
              break;
            }

            throw new _kinvey.default('The id provided is not a string.');

          case 8:
            // Remove the user from the backend
            url = (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/user/".concat(appKey, "/").concat(id), {
              hard: hard ? hard === true : undefined
            });
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.DELETE,
              auth: _auth.Auth.Default,
              url: url,
              timeout: options.timeout
            });
            _context.next = 12;
            return request.execute();

          case 12:
            response = _context.sent;

            if (!(activeUser._id === id)) {
              _context.next = 16;
              break;
            }

            _context.next = 16;
            return activeUser.logout();

          case 16:
            return _context.abrupt("return", response.data);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _remove.apply(this, arguments);
}
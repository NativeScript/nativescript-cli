"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerForLiveService = registerForLiveService;
exports.unregisterForLiveService = unregisterForLiveService;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function registerForLiveService() {
  return _registerForLiveService.apply(this, arguments);
}

function _registerForLiveService() {
  _registerForLiveService = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var activeUser;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            activeUser = getActiveUser();

            if (!activeUser) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return", activeUser.registerForLiveService());

          case 3:
            throw new ActiveUserError('There is no active user');

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _registerForLiveService.apply(this, arguments);
}

function unregisterForLiveService() {
  return _unregisterForLiveService.apply(this, arguments);
}

function _unregisterForLiveService() {
  _unregisterForLiveService = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2() {
    var activeUser;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            activeUser = getActiveUser();

            if (!activeUser) {
              _context2.next = 3;
              break;
            }

            return _context2.abrupt("return", activeUser.unregisterForLiveService());

          case 3:
            throw new ActiveUserError('There is no active user');

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _unregisterForLiveService.apply(this, arguments);
}
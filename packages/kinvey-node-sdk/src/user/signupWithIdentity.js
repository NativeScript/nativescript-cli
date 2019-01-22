"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = signupWithIdentity;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

function signupWithIdentity() {
  return _signupWithIdentity.apply(this, arguments);
}

function _signupWithIdentity() {
  _signupWithIdentity = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            throw new _kinvey.default('This function has been deprecated. You should use MIC to login instead.');

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _signupWithIdentity.apply(this, arguments);
}
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loginWithMIC;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _loginWithRedirectUri = _interopRequireDefault(require("./loginWithRedirectUri"));

function loginWithMIC(_x, _x2, _x3) {
  return _loginWithMIC.apply(this, arguments);
}

function _loginWithMIC() {
  _loginWithMIC = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(redirectUri, authorizationGrant, options) {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", (0, _loginWithRedirectUri.default)(redirectUri, options));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _loginWithMIC.apply(this, arguments);
}
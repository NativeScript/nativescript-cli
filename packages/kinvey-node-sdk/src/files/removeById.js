"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = removeById;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _config = require("../kinvey/config");

var NAMESPACE = 'blob';

function removeById(_x) {
  return _removeById.apply(this, arguments);
}

function _removeById() {
  _removeById = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(id) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        request,
        response,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.DELETE,
              auth: _auth.Auth.Default,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(NAMESPACE, "/").concat(appKey, "/").concat(id)),
              timeout: options.timeout
            });
            _context.next = 5;
            return request.execute();

          case 5:
            response = _context.sent;
            return _context.abrupt("return", response.data);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _removeById.apply(this, arguments);
}
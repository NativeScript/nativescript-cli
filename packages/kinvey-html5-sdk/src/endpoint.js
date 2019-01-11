"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = endpoint;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _utils = require("./http/utils");

var _request = require("./http/request");

var _auth = require("./http/auth");

var _config = require("./kinvey/config");

var _kinvey = _interopRequireDefault(require("./errors/kinvey"));

var RPC_NAMESPACE = 'rpc';

function endpoint(_x, _x2) {
  return _endpoint.apply(this, arguments);
}

function _endpoint() {
  _endpoint = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(endpoint, args) {
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
            options = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};

            if ((0, _isString.default)(endpoint)) {
              _context.next = 3;
              break;
            }

            throw new _kinvey.default('An endpoint is required and must be a string.');

          case 3:
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.POST,
              auth: _auth.Auth.Session,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(RPC_NAMESPACE, "/").concat(appKey, "/custom/").concat(endpoint)),
              body: args,
              timeout: options.timeout
            });
            _context.next = 7;
            return request.execute();

          case 7:
            response = _context.sent;
            return _context.abrupt("return", response.data);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _endpoint.apply(this, arguments);
}
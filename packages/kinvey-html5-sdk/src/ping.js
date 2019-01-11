"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ping;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _config = require("./kinvey/config");

var _utils = require("./http/utils");

var _request = require("./http/request");

var _auth = require("./http/auth");

var APPDATA_NAMESPACE = 'appdata';
/**
 * Pings the Kinvey API service. This can be used to check if you have configured the SDK correctly.
 *
 * @returns {Promise<Object>} The response from the ping request.
 *
 * @example
 * var promise = Kinvey.ping()
 *  .then(function(response) {
 *     console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
 *  })
 *  .catch(function(error) {
 *    console.log('Kinvey Ping Failed. Response: ' + error.description);
 *  });
 */

function ping() {
  return _ping.apply(this, arguments);
}

function _ping() {
  _ping = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var options,
        _getConfig,
        appKey,
        apiProtocol,
        apiHost,
        request,
        response,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 0 && _args[0] !== undefined ? _args[0] : {};
            _getConfig = (0, _config.get)(), appKey = _getConfig.appKey, apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost;
            request = new _request.KinveyRequest({
              method: _request.RequestMethod.GET,
              auth: _auth.Auth.All,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(APPDATA_NAMESPACE, "/").concat(appKey)),
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
  return _ping.apply(this, arguments);
}
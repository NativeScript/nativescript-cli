"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = download;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _config = require("../kinvey/config");

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _downloadByUrl = _interopRequireDefault(require("./downloadByUrl"));

var NAMESPACE = 'blob';

function download(_x) {
  return _download.apply(this, arguments);
}

function _download() {
  _download = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(id) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        _options$stream,
        stream,
        _options$tls,
        tls,
        ttl,
        queryStringObject,
        request,
        response,
        file,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            _options$stream = options.stream, stream = _options$stream === void 0 ? false : _options$stream, _options$tls = options.tls, tls = _options$tls === void 0 ? true : _options$tls, ttl = options.ttl;
            queryStringObject = Object.assign({}, {
              tls: tls === true
            });

            if ((0, _isNumber.default)(ttl)) {
              queryStringObject.ttl_in_seconds = parseInt(ttl, 10);
            }

            request = new _request.KinveyRequest({
              method: _request.RequestMethod.GET,
              auth: _auth.Auth.Default,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(NAMESPACE, "/").concat(appKey, "/").concat(id), queryStringObject),
              timeout: options.timeout
            });
            _context.next = 8;
            return request.execute();

          case 8:
            response = _context.sent;
            file = response.data;

            if (!stream) {
              _context.next = 12;
              break;
            }

            return _context.abrupt("return", file);

          case 12:
            return _context.abrupt("return", (0, _downloadByUrl.default)(file._downloadURL, options));

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _download.apply(this, arguments);
}
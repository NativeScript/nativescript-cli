"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = http;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _http2 = require("tns-core-modules/http");

var _platform = require("tns-core-modules/platform");

function http(_x) {
  return _http.apply(this, arguments);
}

function _http() {
  _http = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(request) {
    var response, data;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _http2.request)({
              headers: request.headers,
              method: request.method,
              url: request.url,
              content: request.body,
              timeout: request.timeout
            });

          case 2:
            response = _context.sent;
            data = response.content.raw;

            try {
              data = response.content.toString();
            } catch (e) {// TODO: Log error
            }

            return _context.abrupt("return", {
              statusCode: response.statusCode,
              headers: response.headers,
              data: data
            });

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _http.apply(this, arguments);
}

function deviceInformation(sdkInfo) {
  var platform = _platform.device.os;
  var version = _platform.device.osVersion;
  var manufacturer = _platform.device.manufacturer;
  var parts = ["js-".concat(sdkInfo.name, "/").concat(sdkInfo.version)];
  return parts.concat([platform, version, manufacturer]).map(function (part) {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInfo(sdkInfo) {
  return {
    hv: 1,
    md: _platform.device.model,
    os: _platform.device.os,
    ov: _platform.device.osVersion,
    sdk: sdkInfo || {
      name: 'SDK unknown (kinvey-http-nativescript)',
      version: 'unknown'
    },
    pv: _platform.device.sdkVersion,
    ty: _platform.device.deviceType,
    id: _platform.device.uuid
  };
}
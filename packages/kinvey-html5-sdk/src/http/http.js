"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = http;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _axios = _interopRequireDefault(require("axios"));

var _timeout = _interopRequireDefault(require("../errors/timeout"));

var _networkConnection = _interopRequireDefault(require("../errors/networkConnection"));

function http(_x) {
  return _http.apply(this, arguments);
}

function _http() {
  _http = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(request) {
    var response;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _axios.default)({
              headers: request.headers,
              method: request.method,
              url: request.url,
              data: request.body,
              timeout: request.timeout
            });

          case 3:
            response = _context.sent;
            _context.next = 23;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);

            if (!_context.t0.response) {
              _context.next = 12;
              break;
            }

            // eslint-disable-next-line prefer-destructuring
            response = _context.t0.response;
            _context.next = 23;
            break;

          case 12:
            if (!_context.t0.request) {
              _context.next = 22;
              break;
            }

            if (!(_context.t0.code === 'ESOCKETTIMEDOUT' || _context.t0.code === 'ETIMEDOUT' || _context.t0.code === 'ECONNABORTED')) {
              _context.next = 17;
              break;
            }

            throw new _timeout.default('The network request timed out.');

          case 17:
            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 19;
              break;
            }

            throw new _networkConnection.default('You do not have a network connection.');

          case 19:
            throw _context.t0;

          case 22:
            throw _context.t0;

          case 23:
            return _context.abrupt("return", {
              statusCode: response.status,
              headers: response.headers,
              data: response.data
            });

          case 24:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 6]]);
  }));
  return _http.apply(this, arguments);
}

function browserDetect(ua) {
  // Cast arguments.
  var userAgent = ua.toLowerCase(); // User-Agent patterns.

  var rChrome = /(chrome)\/([\w]+)/;
  var rFirefox = /(firefox)\/([\w.]+)/;
  var rIE = /(msie) ([\w.]+)/i;
  var rOpera = /(opera)(?:.*version)?[ /]([\w.]+)/;
  var rSafari = /(safari)\/([\w.]+)/;
  return rChrome.exec(userAgent) || rFirefox.exec(userAgent) || rIE.exec(userAgent) || rOpera.exec(userAgent) || rSafari.exec(userAgent) || [];
}

function deviceInformation() {
  var sdkInfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _sdkInfo$name = sdkInfo.name,
      name = _sdkInfo$name === void 0 ? 'SDK unknown (kinvey-http-web)' : _sdkInfo$name,
      _sdkInfo$version = sdkInfo.version,
      version = _sdkInfo$version === void 0 ? 'unknown' : _sdkInfo$version;
  var libraries = [];
  var browser;
  var platform;
  var browserVersion;
  var manufacturer; // Default platform, most likely this is just a plain web app.

  if ((platform === null || platform === undefined) && window.navigator) {
    browser = browserDetect(window.navigator.userAgent);
    platform = browser[1]; // eslint-disable-line prefer-destructuring

    browserVersion = browser[2]; // eslint-disable-line prefer-destructuring

    manufacturer = window.navigator.platform;
  } // Libraries.


  if (window.angular !== undefined) {
    // AngularJS.
    libraries.push("angularjs/".concat(window.angular.version.full));
  }

  if (window.Backbone !== undefined) {
    // Backbone.js.
    libraries.push("backbonejs/".concat(window.Backbone.VERSION));
  }

  if (window.Ember !== undefined) {
    // Ember.js.
    libraries.push("emberjs/".concat(window.Ember.VERSION));
  }

  if (window.jQuery !== undefined) {
    // jQuery.
    libraries.push("jquery/".concat(window.jQuery.fn.jquery));
  }

  if (window.ko !== undefined) {
    // Knockout.
    libraries.push("knockout/".concat(window.ko.version));
  }

  if (window.Zepto !== undefined) {
    // Zepto.js.
    libraries.push('zeptojs');
  } // Return the device information string.


  var parts = ["js-".concat(name, "/").concat(version)];

  if (libraries.length !== 0) {
    // Add external library information.
    parts.push("(".concat(libraries.sort().join(', '), ")"));
  }

  return parts.concat([platform, browserVersion, manufacturer]).map(function (part) {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInfo(sdkInfo) {
  return {
    hv: 1,
    os: window.navigator.appVersion,
    ov: window.navigator.appVersion,
    sdk: sdkInfo || {
      name: 'SDK unknown (kinvey-http-web)',
      version: 'unknown'
    },
    pv: window.navigator.userAgent
  };
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequestMethod = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _errors = require('../../errors');

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _appendQuery = require('append-query');

var _appendQuery2 = _interopRequireDefault(_appendQuery);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultTimeout = process && process.env && process.env.KINVEY_DEFAULT_TIMEOUT || '30' || 30;

/**
 * @private
 * Enum for Request Methods.
 */
var RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(RequestMethod);
exports.RequestMethod = RequestMethod;

/**
 * @private
 */

var Request = function () {
  function Request() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Request);

    options = (0, _assign2.default)({
      method: RequestMethod.GET,
      headers: new _headers2.default(),
      url: '',
      body: null,
      timeout: defaultTimeout,
      followRedirect: true,
      cache: false
    }, options);

    this.method = options.method;
    this.headers = options.headers;
    this.url = options.url;
    this.body = options.body || options.data;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.cache = options.cache;
    this.executing = false;
  }

  _createClass(Request, [{
    key: 'isExecuting',
    value: function isExecuting() {
      return !!this.executing;
    }
  }, {
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var response;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.rack) {
                  _context.next = 2;
                  break;
                }

                throw new _errors.KinveyError('Unable to execute the request. Please provide a rack to execute the request.');

              case 2:
                _context.next = 4;
                return this.rack.execute(this.toPlainObject());

              case 4:
                response = _context.sent;

                if (response) {
                  _context.next = 7;
                  break;
                }

                throw new _errors.NoResponseError();

              case 7:

                if (!(response instanceof _response2.default)) {
                  response = new _response2.default({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  });
                }

                return _context.abrupt('return', response);

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function execute() {
        return _ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      return {
        method: this.method,
        headers: this.headers.toPlainObject(),
        url: this.url,
        body: this.body,
        timeout: this.timeout,
        followRedirect: this.followRedirect
      };
    }
  }, {
    key: 'method',
    get: function get() {
      return this._method;
    },
    set: function set(method) {
      if (!(0, _isString2.default)(method)) {
        method = String(method);
      }

      method = method.toUpperCase();
      switch (method) {
        case RequestMethod.GET:
        case RequestMethod.POST:
        case RequestMethod.PATCH:
        case RequestMethod.PUT:
        case RequestMethod.DELETE:
          this._method = method;
          break;
        default:
          throw new Error('Invalid request method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
      }
    }
  }, {
    key: 'headers',
    get: function get() {
      return this._headers;
    },
    set: function set(headers) {
      if (!(headers instanceof _headers2.default)) {
        headers = new _headers2.default(headers);
      }

      this._headers = headers;
    }
  }, {
    key: 'url',
    get: function get() {
      // If `cache` is true, add a cache busting query string.
      // This is useful for Android < 4.0 which caches all requests aggressively.
      if (this.cache === true) {
        return (0, _appendQuery2.default)(this._url, _qs2.default.stringify({
          _: Math.random().toString(36).substr(2)
        }));
      }

      return this._url;
    },
    set: function set(urlString) {
      this._url = urlString;
    }
  }, {
    key: 'data',
    get: function get() {
      return this.body;
    },
    set: function set(data) {
      this.body = data;
    }
  }, {
    key: 'timeout',
    get: function get() {
      return this._timeout;
    },
    set: function set(timeout) {
      this._timeout = (0, _isNumber2.default)(timeout) ? timeout : defaultTimeout;
    }
  }, {
    key: 'followRedirect',
    get: function get() {
      return this._followRedirect;
    },
    set: function set(followRedirect) {
      this._followRedirect = !!followRedirect;
    }
  }, {
    key: 'cache',
    get: function get() {
      return this._cache;
    },
    set: function set(cache) {
      this._cache = !!cache;
    }
  }]);

  return Request;
}();

exports.default = Request;
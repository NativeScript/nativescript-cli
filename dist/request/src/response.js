'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StatusCode = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

var _errors = require('../../errors');

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StatusCode = {
  Ok: 200,
  Created: 201,
  Empty: 204,
  RedirectTemporarily: 301,
  RedirectPermanently: 302,
  NotModified: 304,
  ResumeIncomplete: 308,
  NotFound: 404,
  ServerError: 500,
  Unauthorized: 401
};
Object.freeze(StatusCode);
exports.StatusCode = StatusCode;

var Response = function () {
  function Response() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Response);

    options = (0, _assign2.default)({
      statusCode: StatusCode.Empty,
      headers: new _headers2.default(),
      data: null
    }, options);

    this.statusCode = options.statusCode;
    this.headers = options.headers;
    this.data = options.data;
  }

  _createClass(Response, [{
    key: 'isSuccess',
    value: function isSuccess() {
      return this.statusCode >= 200 && this.statusCode < 300 || this.statusCode === StatusCode.RedirectPermanently || this.statusCode === StatusCode.NotModified;
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
    key: 'error',
    get: function get() {
      if (this.isSuccess()) {
        return null;
      }

      var data = this.data || {};
      var message = data.message || data.description;
      var debug = data.debug;
      var code = this.statusCode;

      return new _errors.KinveyError(message, debug, code);
    }
  }]);

  return Response;
}();

exports.default = Response;
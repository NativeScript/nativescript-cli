'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _headers = require('./headers');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */
var Response = function () {
  function Response(response) {
    _classCallCheck(this, Response);

    this.statusCode = response.statusCode;
    this.headers = new _headers.Headers(response.headers);
    this.data = response.data;
  }

  _createClass(Response, [{
    key: 'isSuccess',
    value: function isSuccess() {
      return this.statusCode >= 200 && this.statusCode < 300 || this.statusCode === 301 || this.statusCode === 302 || this.statusCode === 304 || this.statusCode === 307 || this.statusCode === 308;
    }
  }, {
    key: 'error',
    get: function get() {
      if (!this.isSuccess()) {
        var _data = this.data,
            code = _data.code,
            name = _data.name;

        var message = this.data.message || this.data.description;
        // const debug = responseData.debug;
        // const code = response.statusCode;
        // const kinveyRequestId = responseHeaders.get('X-Kinvey-Request-ID');

        if (code === 'ESOCKETTIMEDOUT' || code === 'ETIMEDOUT') {
          return new Error('The network request timed out.');
        } else if (code === 'ENOENT') {
          return new Error('You do not have a network connection.');
        }

        var error = new Error(message);
        error.code = this.statusCode;

        if (name) {
          error.name = name;
        }

        return error;
      }

      return null;
    }
  }]);

  return Response;
}();

exports.default = Response;
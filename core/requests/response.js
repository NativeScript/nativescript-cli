'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enums = require('../enums');

var _errors = require('../errors');

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */

var Response = function () {
  function Response() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Response);

    options = (0, _assign2.default)({
      statusCode: _enums.StatusCode.Ok,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      data: null
    }, options);

    this.statusCode = options.statusCode;
    this.addHeaders(options.headers);
    this.data = options.data;
  }

  _createClass(Response, [{
    key: 'getHeader',
    value: function getHeader(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers || {};
        var keys = Object.keys(headers);

        for (var i = 0, len = keys.length; i < len; i++) {
          var key = keys[i];

          if (key.toLowerCase() === name.toLowerCase()) {
            return headers[key];
          }
        }
      }

      return undefined;
    }
  }, {
    key: 'setHeader',
    value: function setHeader(name, value) {
      if (!name || !value) {
        throw new Error('A name and value must be provided to set a header.');
      }

      if (!(0, _isString2.default)(name)) {
        name = String(name);
      }

      var headers = this.headers || {};

      if (!(0, _isString2.default)(value)) {
        headers[name] = JSON.stringify(value);
      } else {
        headers[name] = value;
      }

      this.headers = headers;
    }
  }, {
    key: 'addHeaders',
    value: function addHeaders(headers) {
      var _this = this;

      if (!(0, _isPlainObject2.default)(headers)) {
        throw new Error('Headers argument must be an object.');
      }

      var names = Object.keys(headers);

      (0, _forEach2.default)(names, function (name) {
        var value = headers[name];
        _this.setHeader(name, value);
      });
    }
  }, {
    key: 'removeHeader',
    value: function removeHeader(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers || {};
        delete headers[name];
        this.headers = headers;
      }
    }
  }, {
    key: 'clearHeaders',
    value: function clearHeaders() {
      this.headers = {};
    }
  }, {
    key: 'isSuccess',
    value: function isSuccess() {
      return this.statusCode >= 200 && this.statusCode < 300;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        statusCode: this.statusCode,
        headers: this.headers,
        data: this.data
      };
      return json;
    }
  }, {
    key: 'error',
    get: function get() {
      if (this.isSuccess()) {
        return null;
      }

      var data = (0, _clone2.default)(this.data, true);
      var name = data.name || data.error;
      var message = data.message || data.description;
      var debug = data.debug;

      if (name === 'EntityNotFound' || name === 'CollectionNotFound' || name === 'AppNotFound' || name === 'UserNotFound' || name === 'BlobNotFound' || name === 'DocumentNotFound') {
        return new _errors.NotFoundError(message, debug);
      } else if (name === 'InsufficientCredentials') {
        return new _errors.InsufficientCredentialsError(message, debug);
      } else if (name === 'InvalidCredentials') {
        return new _errors.InvalidCredentialsError(message, debug);
      }

      return new _errors.KinveyError(message, debug);
    }
  }]);

  return Response;
}();

exports.default = Response;
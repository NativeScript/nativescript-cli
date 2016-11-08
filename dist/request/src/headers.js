'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Headers = function () {
  function Headers() {
    var headers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Headers);

    this.headers = {};
    this.addAll(headers);
  }

  _createClass(Headers, [{
    key: 'get',
    value: function get(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers;
        return headers[name.toLowerCase()];
      }

      return undefined;
    }
  }, {
    key: 'set',
    value: function set(name, value) {
      if (name === undefined || name === null || value === undefined || value === null) {
        throw new Error('A name and value must be provided to set a header.');
      }

      if (!(0, _isString2.default)(name)) {
        name = String(name);
      }

      var headers = this.headers;
      name = name.toLowerCase();

      if (!(0, _isString2.default)(value)) {
        headers[name] = JSON.stringify(value);
      } else {
        headers[name] = value;
      }

      this.headers = headers;
      return this;
    }
  }, {
    key: 'has',
    value: function has(name) {
      return !!this.get(name);
    }
  }, {
    key: 'add',
    value: function add() {
      var header = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.set(header.name, header.value);
    }
  }, {
    key: 'addAll',
    value: function addAll() {
      var _this = this;

      var headers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (headers instanceof Headers) {
        headers = headers.toPlainObject();
      }

      if (!(0, _isPlainObject2.default)(headers)) {
        throw new Error('Headers argument must be an object.');
      }

      var names = Object.keys(headers);
      (0, _forEach2.default)(names, function (name) {
        try {
          _this.set(name, headers[name]);
        } catch (error) {}
      });
      return this;
    }
  }, {
    key: 'remove',
    value: function remove(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers;
        delete headers[name.toLowerCase()];
        this.headers = headers;
      }

      return this;
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.headers = {};
      return this;
    }
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      return this.headers;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return JSON.stringify(this.toPlainObject());
    }
  }]);

  return Headers;
}();

exports.default = Headers;
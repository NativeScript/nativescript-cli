'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyHeaders = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';

function isNotString(val) {
  return !(0, _isString2.default)(val);
}

/**
 * @private
 */

var Headers = function () {
  function Headers(headers) {
    var _this = this;

    _classCallCheck(this, Headers);

    this.headers = new Map();
    this.normalizedNames = new Map();

    if (headers) {
      if (headers instanceof Headers) {
        headers.keys().forEach(function (header) {
          var value = headers.get(header);
          _this.set(header, value);
        });
      } else {
        Object.keys(headers).forEach(function (header) {
          var value = headers[header];
          _this.set(header, value);
        });
      }
    }
  }

  _createClass(Headers, [{
    key: 'has',
    value: function has(name) {
      if (!(0, _isString2.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.has(name.toLowerCase());
    }
  }, {
    key: 'get',
    value: function get(name) {
      if (!(0, _isString2.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.get(name.toLowerCase());
    }
  }, {
    key: 'keys',
    value: function keys() {
      return Array.from(this.normalizedNames.values());
    }
  }, {
    key: 'set',
    value: function set(name, value) {
      if (!(0, _isString2.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      if (!(0, _isString2.default)(value) && !(0, _isArray2.default)(value) || (0, _isArray2.default)(value) && value.some(isNotString)) {
        throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
      }

      var key = name.toLowerCase();

      if ((0, _isArray2.default)(value)) {
        this.headers.set(key, value.join(','));
      } else {
        this.headers.set(key, value);
      }

      if (!this.normalizedNames.has(key)) {
        this.normalizedNames.set(key, name);
      }

      return this;
    }
  }, {
    key: 'join',
    value: function join(headers) {
      var _this2 = this;

      if (headers instanceof Headers) {
        headers.keys().forEach(function (header) {
          var value = headers.get(header);
          _this2.set(header, value);
        });
      } else {
        Object.keys(headers).forEach(function (header) {
          var value = headers[header];
          _this2.set(header, value);
        });
      }

      return this;
    }
  }, {
    key: 'delete',
    value: function _delete(name) {
      if (!(0, _isString2.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.delete(name.toLowerCase());
    }
  }, {
    key: 'toObject',
    value: function toObject() {
      var _this3 = this;

      return this.keys().reduce(function (headers, header) {
        // eslint-disable-next-line no-param-reassign
        headers[header] = _this3.get(header);
        return headers;
      }, {});
    }
  }]);

  return Headers;
}();

/**
 * @private
 */


exports.default = Headers;

var KinveyHeaders = exports.KinveyHeaders = function (_Headers) {
  _inherits(KinveyHeaders, _Headers);

  function KinveyHeaders(headers) {
    _classCallCheck(this, KinveyHeaders);

    // Add the Accept header
    var _this4 = _possibleConstructorReturn(this, (KinveyHeaders.__proto__ || Object.getPrototypeOf(KinveyHeaders)).call(this, headers));

    if (!_this4.has('Accept')) {
      _this4.set('Accept', 'application/json; charset=utf-8');
    }

    // Add the X-Kinvey-API-Version header
    if (!_this4.has('X-Kinvey-Api-Version')) {
      _this4.set('X-Kinvey-Api-Version', '4');
    }
    return _this4;
  }

  _createClass(KinveyHeaders, [{
    key: 'requestStart',
    get: function get() {
      return this.get(X_KINVEY_REQUEST_START_HEADER);
    }
  }]);

  return KinveyHeaders;
}(Headers);
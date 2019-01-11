"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyHeaders = exports.Headers = void 0;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var X_KINVEY_REQUEST_START_HEADER = 'X-Kinvey-Request-Start';
var X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER = 'X-Kinvey-Custom-Request-Properties';

function isNotString(val) {
  return !(0, _isString.default)(val);
}

var Headers =
/*#__PURE__*/
function () {
  function Headers(headers) {
    var _this = this;

    (0, _classCallCheck2.default)(this, Headers);
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

  (0, _createClass2.default)(Headers, [{
    key: "has",
    value: function has(name) {
      if (!(0, _isString.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.has(name.toLowerCase());
    }
  }, {
    key: "get",
    value: function get(name) {
      if (!(0, _isString.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.get(name.toLowerCase());
    }
  }, {
    key: "keys",
    value: function keys() {
      return Array.from(this.normalizedNames.values());
    }
  }, {
    key: "set",
    value: function set(name, value) {
      if (!(0, _isString.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      if (!(0, _isString.default)(value) && !(0, _isArray.default)(value) && !(0, _isFunction.default)(value) || (0, _isArray.default)(value) && value.some(isNotString)) {
        throw new Error('Please provide a value. Value must be a string or an array that contains only strings.');
      }

      var key = name.toLowerCase();

      if ((0, _isArray.default)(value)) {
        this.headers.set(key, value.join(','));
      } else if ((0, _isFunction.default)(value)) {
        var val = value();
        return this.set(name, val);
      } else {
        this.headers.set(key, value);
      }

      if (!this.normalizedNames.has(key)) {
        this.normalizedNames.set(key, name);
      }

      return this;
    }
  }, {
    key: "join",
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
    key: "delete",
    value: function _delete(name) {
      if (!(0, _isString.default)(name)) {
        throw new Error('Please provide a name. Name must be a string.');
      }

      return this.headers.delete(name.toLowerCase());
    }
  }, {
    key: "toObject",
    value: function toObject() {
      var _this3 = this;

      return this.keys().reduce(function (headers, header) {
        // eslint-disable-next-line no-param-reassign
        headers[header] = _this3.get(header);
        return headers;
      }, {});
    }
  }, {
    key: "contentType",
    get: function get() {
      return this.get('Content-Type');
    }
  }]);
  return Headers;
}();

exports.Headers = Headers;

function byteCount(str) {
  if (str) {
    var count = 0;
    var stringLength = str.length;

    for (var i = 0; i < stringLength; i += 1) {
      var partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

var KinveyHeaders =
/*#__PURE__*/
function (_Headers) {
  (0, _inherits2.default)(KinveyHeaders, _Headers);

  function KinveyHeaders(headers) {
    var _this4;

    (0, _classCallCheck2.default)(this, KinveyHeaders);
    _this4 = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(KinveyHeaders).call(this, headers)); // Add the Accept header

    if (!_this4.has('Accept')) {
      _this4.set('Accept', 'application/json; charset=utf-8');
    } // Add Content-Type header


    if (!_this4.has('Content-Type')) {
      _this4.set('Content-Type', 'application/json; charset=utf-8');
    } // Add the X-Kinvey-API-Version header


    if (!_this4.has('X-Kinvey-Api-Version')) {
      _this4.set('X-Kinvey-Api-Version', '4');
    }

    return _this4;
  }

  (0, _createClass2.default)(KinveyHeaders, [{
    key: "requestStart",
    get: function get() {
      return this.get(X_KINVEY_REQUEST_START_HEADER);
    }
  }, {
    key: "customRequestProperties",
    get: function get() {
      return this.get(X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER);
    },
    set: function set(properties) {
      var customRequestPropertiesVal = JSON.stringify(properties);

      if (!(0, _isEmpty.default)(customRequestPropertiesVal)) {
        var customRequestPropertiesByteCount = byteCount(customRequestPropertiesVal);

        if (customRequestPropertiesByteCount >= 2000) {
          throw new _kinvey.default("The custom properties are ".concat(customRequestPropertiesByteCount, " bytes.") + 'It must be less then 2000 bytes.', 'Please remove some custom properties.');
        }

        this.set(X_KINVEY_CUSTOM_REQUEST_PROPERTIES_HEADER, customRequestPropertiesVal);
      } else {
        this.delete('X-Kinvey-Custom-Request-Properties');
      }
    }
  }]);
  return KinveyHeaders;
}(Headers);

exports.KinveyHeaders = KinveyHeaders;
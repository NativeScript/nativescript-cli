'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enums = require('../enums');

var _device = require('../device');

var _device2 = _interopRequireDefault(_device);

var _properties = require('./properties');

var _properties2 = _interopRequireDefault(_properties);

var _string = require('../utils/string');

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */

var Request = function () {
  function Request() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Request);

    options = (0, _assign2.default)({
      method: _enums.HttpMethod.GET,
      headers: {},
      url: null,
      data: null,
      timeout: process.env.KINVEY_DEFAULT_TIMEOUT || 10000,
      followRedirect: true
    }, options);

    this.method = options.method;
    this.url = options.url;
    this.data = options.data || options.body;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.executing = false;

    var headers = options.headers && (0, _isPlainObject2.default)(options.headers) ? options.headers : {};

    if (!headers.Accept || !headers.accept) {
      headers.Accept = 'application/json; charset=utf-8';
    }

    this.addHeaders(headers);
  }

  _createClass(Request, [{
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
    key: 'isExecuting',
    value: function isExecuting() {
      return this.executing ? true : false;
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this2 = this;

      if (this.executing) {
        return Promise.reject(new Error('Unable to execute the request. The request is already executing.'));
      }

      this.executing = Promise.resolve().then(function (response) {
        _this2.executing = false;
        return response;
      }).catch(function (err) {
        _this2.executing = false;
        throw err;
      });

      return this.executing;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        method: this.method,
        headers: this.headers,
        url: this.url,
        data: this.data,
        followRedirect: this.followRedirect
      };

      return (0, _clone2.default)(json, true);
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
        case _enums.HttpMethod.GET:
        case _enums.HttpMethod.POST:
        case _enums.HttpMethod.PATCH:
        case _enums.HttpMethod.PUT:
        case _enums.HttpMethod.DELETE:
          this._method = method;
          break;
        default:
          throw new Error('Invalid Http Method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
      }
    }
  }, {
    key: 'body',
    get: function get() {
      return this.data;
    },
    set: function set(body) {
      this.data = body;
    }
  }, {
    key: 'data',
    get: function get() {
      return this._data;
    },
    set: function set(data) {
      if (data) {
        var contentTypeHeader = this.getHeader('Content-Type');
        if (!contentTypeHeader) {
          this.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        this.removeHeader('Content-Type');
      }

      this._data = data;
    }
  }]);

  return Request;
}();

/**
 * @private
 */


var KinveyRequest = function (_Request) {
  _inherits(KinveyRequest, _Request);

  function KinveyRequest() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, KinveyRequest);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRequest).call(this, options));

    options = (0, _assign2.default)({
      properties: null,
      auth: null,
      query: null
    }, options);

    _this3.properties = options.properties;
    _this3.auth = options.auth;
    _this3.query = (0, _result2.default)(options.query, 'toJSON', options.query);

    var headers = {};
    headers['X-Kinvey-Api-Version'] = process.env.KINVEY_API_VERSION || 3;

    var device = new _device2.default();
    headers['X-Kinvey-Device-Information'] = JSON.stringify(device.toJSON());

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    _this3.addHeaders(headers);
    return _this3;
  }

  _createClass(KinveyRequest, [{
    key: 'execute',
    value: function execute() {
      var _this4 = this;

      var promise = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'execute', this).call(this).then(function () {
        return _this4.auth;
      }).then(function (authInfo) {
        if (authInfo) {
          var credentials = authInfo.credentials;

          if (authInfo.username) {
            credentials = new Buffer(authInfo.username + ':' + authInfo.password).toString('base64');
          }

          _this4.setHeader('Authorization', authInfo.scheme + ' ' + credentials);
        }
      });

      return promise;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'toJSON', this).call(this);
      json.query = this.query;
      return (0, _clone2.default)(json, true);
    }
  }, {
    key: 'authHandler',
    set: function set(authHandler) {
      this.authHandler = authHandler;
    }
  }, {
    key: 'properties',
    set: function set(properties) {
      if (properties) {
        if (!(properties instanceof _properties2.default)) {
          properties = new _properties2.default((0, _result2.default)(properties, 'toJSON', properties));
        }

        var appVersion = properties.appVersion;

        if (appVersion) {
          this.setHeader('X-Kinvey-Client-App-Version', appVersion);
        } else {
          this.removeHeader('X-Kinvey-Client-App-Version');
        }

        var customProperties = (0, _result2.default)(properties, 'toJSON', {});
        delete customProperties.appVersion;
        var customPropertiesHeader = JSON.stringify(customProperties);
        var customPropertiesByteCount = (0, _string.byteCount)(customPropertiesHeader);
        var customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

        if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
          throw new Error('The custom properties are ' + customPropertiesByteCount + ' bytes.' + ('It must be less then ' + customPropertiesMaxBytesAllowed + ' bytes.'), 'Please remove some custom properties.');
        }

        this.setHeader('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
      }
    }
  }]);

  return KinveyRequest;
}(Request);

exports.default = KinveyRequest;
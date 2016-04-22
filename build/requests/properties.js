'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequestProperties = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../errors');

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appVersionKey = 'appVersion';

/**
 * Request Properties class
 */

var RequestProperties = exports.RequestProperties = function () {
  function RequestProperties() {
    var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RequestProperties);

    this.properties = properties;
  }

  _createClass(RequestProperties, [{
    key: 'getProperty',


    /**
     * Returns the request property for the key or `undefined` if
     * it has not been set.
     *
     * @param  {String} key Request property key
     * @return {*} Request property value
     */
    value: function getProperty(key) {
      var properties = this.toJSON();

      if (key && properties.hasOwnProperty(key)) {
        return properties[key];
      }

      return undefined;
    }

    /**
     * Sets the request property key to the value.
     *
     * @param {String} key Request property key
     * @param {*} value Request property value
     * @return {RequestProperties} The request properties instance.
     */

  }, {
    key: 'setProperty',
    value: function setProperty(key, value) {
      var properties = {};
      properties[key] = value;
      this.addProperties(properties);
      return this;
    }
  }, {
    key: 'addProperties',
    value: function addProperties(properties) {
      var _this = this;

      if (!(0, _isPlainObject2.default)(properties)) {
        throw new _errors.KinveyError('properties argument must be an object');
      }

      Object.keys(properties).forEach(function (key) {
        var value = properties[key];

        if (value) {
          _this.properties[key] = value;
        } else {
          delete _this.properties[key];
        }
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.properties = {};
    }
  }, {
    key: 'clearProperty',
    value: function clearProperty(key) {
      var properties = this.properties;

      if (key && properties.hasOwnProperty(key)) {
        delete properties[key];
      }
    }

    /**
     * Clears the app version property.
     *
     * @return {RequestProperties} The request properties instance.
     */

  }, {
    key: 'clearAppVersion',
    value: function clearAppVersion() {
      return this.clearProperty(appVersionKey);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.properties;
    }
  }, {
    key: 'properties',
    get: function get() {
      return this._properties;
    },
    set: function set(properties) {
      this._properties = properties;
    }

    /**
     * Return the app version request property.
     *
     * @return {String} App version
     */

  }, {
    key: 'appVersion',
    get: function get() {
      return this.getProperty(appVersionKey);
    }

    /**
     * Set the app version request property. The app version can be provided
     * in major.minor.patch format or something specific to your application.
     *
     * @param  {Any} version App version.
     * @return {RequestProperties} The request properties instance.
     */
    ,
    set: function set(args) {
      var version = Array.prototype.slice.call(args, 1);
      var major = args[0];
      var minor = version[1];
      var patch = version[2];
      var appVersion = '';

      if (major) {
        appVersion = ('' + major).trim();
      }

      if (minor) {
        appVersion = ('.' + minor).trim();
      }

      if (patch) {
        appVersion = ('.' + patch).trim();
      }

      this.setProperty(appVersionKey, appVersion);
      return this;
    }
  }]);

  return RequestProperties;
}();
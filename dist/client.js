'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Client = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rack = require('./rack');

var _rack2 = _interopRequireDefault(_rack);

var _errors = require('./errors');

var _utils = require('./utils');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _sharedInstance = null;

var Client = exports.Client = function () {
  function Client() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Client);

    options = (0, _assign2.default)({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      liveServiceHostname: 'https://kls.kinvey.com'
    }, options);

    if (options.apiHostname && (0, _isString2.default)(options.apiHostname)) {
      var apiHostnameParsed = _url2.default.parse(options.apiHostname);
      options.apiProtocol = apiHostnameParsed.protocol || 'https:';
      options.apiHost = apiHostnameParsed.host;
    }

    if (options.micHostname && (0, _isString2.default)(options.micHostname)) {
      var micHostnameParsed = _url2.default.parse(options.micHostname);
      options.micProtocol = micHostnameParsed.protocol || 'https:';
      options.micHost = micHostnameParsed.host;
    }

    if (options.liveServiceHostname && (0, _isString2.default)(options.liveServiceHostname)) {
      var liveServiceHostnameParsed = _url2.default.parse(options.liveServiceHostname);
      options.liveServiceProtocol = liveServiceHostnameParsed.protocol || 'https:';
      options.liveServiceHost = liveServiceHostnameParsed.host;
    }

    this.apiProtocol = options.apiProtocol;

    this.apiHost = options.apiHost;

    this.micProtocol = options.micProtocol;

    this.micHost = options.micHost;

    this.liveServiceProtocol = options.liveServiceProtocol;

    this.liveServiceHost = options.liveServiceHost;

    this.appKey = options.appKey;

    this.appSecret = options.appSecret;

    this.masterSecret = options.masterSecret;

    this.encryptionKey = options.encryptionKey;

    this.appVersion = options.appVersion;

    this.cacheRack = options.cacheRack || new _rack.CacheRack();

    this.networkRack = options.networkRack || new _rack.NetworkRack();

    this.deviceClass = options.deviceClass || _utils.Device;

    this.popupClass = options.popupClass;
  }

  _createClass(Client, [{
    key: 'toPlainObject',
    value: function toPlainObject() {
      return {
        apiHostname: this.apiHostname,
        apiProtocol: this.apiProtocol,
        apiHost: this.apiHost,
        micHostname: this.micHostname,
        micProtocol: this.micProtocol,
        micHost: this.micHost,
        liveServiceHostname: this.liveServiceHostname,
        liveServiceHost: this.liveServiceHost,
        liveServiceProtocol: this.liveServiceProtocol,
        appKey: this.appKey,
        appSecret: this.appSecret,
        masterSecret: this.masterSecret,
        encryptionKey: this.encryptionKey,
        appVersion: this.appVersion
      };
    }
  }, {
    key: 'apiHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.apiProtocol,
        host: this.apiHost
      });
    }
  }, {
    key: 'baseUrl',
    get: function get() {
      return this.apiHostname;
    }
  }, {
    key: 'protocol',
    get: function get() {
      return this.apiProtocol;
    }
  }, {
    key: 'host',
    get: function get() {
      return this.apiHost;
    }
  }, {
    key: 'micHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.micProtocol,
        host: this.micHost
      });
    }
  }, {
    key: 'liveServiceHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.liveServiceProtocol,
        host: this.liveServiceHost
      });
    }
  }, {
    key: 'appVersion',
    get: function get() {
      return this._appVersion;
    },
    set: function set(appVersion) {
      if (appVersion && !(0, _isString2.default)(appVersion)) {
        appVersion = String(appVersion);
      }

      this._appVersion = appVersion;
    }
  }, {
    key: 'cacheRack',
    get: function get() {
      return this._cacheRack;
    },
    set: function set(rack) {
      if (rack && !(rack instanceof _rack2.default)) {
        throw new _errors.KinveyError('rack must be an instance of the Rack class.');
      }

      this._cacheRack = rack;
    }
  }, {
    key: 'networkRack',
    get: function get() {
      return this._networkRack;
    },
    set: function set(rack) {
      if (rack && !(rack instanceof _rack2.default)) {
        throw new _errors.KinveyError('rack must be an instance of the Rack class.');
      }

      this._networkRack = rack;
    }
  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      _sharedInstance = client;
      return client;
    }
  }, {
    key: 'sharedInstance',
    value: function sharedInstance() {
      if (!_sharedInstance) {
        throw new _errors.KinveyError('You have not initialized the library. ' + 'Please call Kinvey.init() to initialize the library.');
      }

      return _sharedInstance;
    }
  }]);

  return Client;
}();
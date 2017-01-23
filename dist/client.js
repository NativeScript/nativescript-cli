'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('./request');

var _errors = require('./errors');

var _utils = require('./utils');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultTimeout = process && process.env && process.env.KINVEY_DEFAULT_TIMEOUT || '60000' || 60000;
var _sharedInstance = null;

var Client = function () {
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

    this.defaultTimeout = (0, _utils.isDefined)(options.defaultTimeout) ? options.defaultTimeout : defaultTimeout;
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
    key: 'activeUser',
    get: function get() {
      return _request.CacheRequest.getActiveUser(this);
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
    key: 'defaultTimeout',
    get: function get() {
      return this._defaultTimeout;
    },
    set: function set(timeout) {
      timeout = parseInt(timeout, 10);

      if ((0, _isNumber2.default)(timeout) === false || isNaN(timeout)) {
        throw new _errors.KinveyError('Invalid timeout. Timeout must be a number.');
      }

      if (timeout < 0) {
        _utils.Log.info('Default timeout is less than 0. Setting default timeout to ' + defaultTimeout + 'ms.');
        timeout = defaultTimeout;
      }

      this._defaultTimeout = timeout;
    }
  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      _sharedInstance = client;
      _request.CacheRequest.loadActiveUserLegacy(client);
      return client;
    }
  }, {
    key: 'initialize',
    value: function initialize(options) {
      var client = new Client(options);
      _sharedInstance = client;
      return _request.CacheRequest.loadActiveUser(client).then(function () {
        return client;
      });
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

exports.default = Client;
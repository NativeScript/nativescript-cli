'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Client = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _storage = require('./utils/storage');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _sharedInstance = null;

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */

var Client = exports.Client = function () {
  /**
   * Creates a new instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      An instance of the Client class.
   *
   * @example
   * var client = new Kinvey.Client({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   */

  function Client() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Client);

    options = (0, _assign2.default)({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      liveServiceHostname: 'https://kls.kinvey.com'
    }, options);

    if (options.apiHostname && (0, _isString2.default)(options.apiHostname)) {
      var apiHostnameParsed = _url2.default.parse(options.apiHostname);
      options.apiProtocol = apiHostnameParsed.protocol;
      options.apiHost = apiHostnameParsed.host;
    }

    if (options.micHostname && (0, _isString2.default)(options.micHostname)) {
      var micHostnameParsed = _url2.default.parse(options.micHostname);
      options.micProtocol = micHostnameParsed.protocol;
      options.micHost = micHostnameParsed.host;
    }

    if (options.liveServiceHostname && (0, _isString2.default)(options.liveServiceHostname)) {
      var liveServiceHostnameParsed = _url2.default.parse(options.liveServiceHostname);
      options.liveServiceProtocol = liveServiceHostnameParsed.protocol;
      options.liveServiceHost = liveServiceHostnameParsed.host;
    }

    /**
     * @type {string}
     */
    this.apiProtocol = options.apiProtocol;

    /**
     * @type {string}
     */
    this.apiHost = options.apiHost;

    /**
     * @type {string}
     */
    this.micProtocol = options.micProtocol;

    /**
     * @type {string}
     */
    this.micHost = options.micHost;

    /**
     * @type {string}
     */
    this.liveServiceProtocol = options.liveServiceProtocol;

    /**
     * @type {string}
     */
    this.liveServiceHost = options.liveServiceHost;

    /**
     * @type {?string}
     */
    this.appKey = options.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = options.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = options.appVersion;
  }

  /**
   * API host name used for Kinvey API requests.
   */


  _createClass(Client, [{
    key: 'toJSON',


    /**
     * Returns an object containing all the information for this Client.
     *
     * @return {Object} JSON
     */
    value: function toJSON() {
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

    /**
     * Initializes the Client class by creating a new instance of the
     * Client class and storing it as a shared instance.
     *
     * @param {Object}    options                                            Options
     * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
     * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
     * @param {string}    [options.appKey]                                   App Key
     * @param {string}    [options.appSecret]                                App Secret
     * @param {string}    [options.masterSecret]                             App Master Secret
     * @param {string}    [options.encryptionKey]                            App Encryption Key
     * @param {string}    [options.appVersion]                               App Version
     * @return {Client}                                                      An instance of Client.
     *
     * @example
     * var client = Kinvey.Client.init({
     *   appKey: '<appKey>',
     *   appSecret: '<appSecret>'
     * });
     * Kinvey.Client.sharedInstance() === client; // true
     */

  }, {
    key: 'apiHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.apiProtocol,
        host: this.apiHost
      });
    }

    /**
     * @deprecated Use apiHostname instead of this.
     */

  }, {
    key: 'baseUrl',
    get: function get() {
      return this.apiHostname;
    }

    /**
     * @deprecated Use apiProtocol instead of this.
     */

  }, {
    key: 'protocol',
    get: function get() {
      return this.apiProtocol;
    }

    /**
     * @deprecated Use apiHost instead of this.
     */

  }, {
    key: 'host',
    get: function get() {
      return this.apiHost;
    }

    /**
     * Mobile Identity Connect host name used for MIC requests.
     */

  }, {
    key: 'micHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.micProtocol,
        host: this.micHost
      });
    }

    /**
     * Live Service host name used for streaming data.
     */

  }, {
    key: 'liveServiceHostname',
    get: function get() {
      return _url2.default.format({
        protocol: this.liveServiceProtocol,
        host: this.liveServiceHost
      });
    }

    /**
     * Active user for your app.
     */

  }, {
    key: 'activeUser',
    get: function get() {
      return (0, _storage.getActiveUser)(this);
    }

    /**
     * The version of your app. It will sent with Kinvey API requests
     * using the X-Kinvey-Api-Version header.
     */

  }, {
    key: 'appVersion',
    get: function get() {
      return this._appVersion;
    }

    /**
     * Set the version of your app. It will sent with Kinvey API requests
     * using the X-Kinvey-Api-Version header.
     *
     * @param  {String} appVersion  App version.
     */
    ,
    set: function set(appVersion) {
      if (appVersion && !(0, _isString2.default)(appVersion)) {
        appVersion = String(appVersion);
      }

      this._appVersion = appVersion;
    }
  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      _sharedInstance = client;
      return client;
    }

    /**
     * Returns the shared instance of the Client class used by the SDK.
     *
     * @throws {KinveyError} If a shared instance does not exist.
     *
     * @return {Client} The shared instance.
     *
     * @example
     * var client = Kinvey.Client.sharedInstance();
     */

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
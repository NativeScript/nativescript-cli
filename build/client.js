'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Client = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var activeUserCollectionName = process.env.KINVEY_ACTIVE_USER_COLLECTION_NAME || 'kinvey_activeUser';
var activeSocialIdentityTokenCollectionName = process.env.KINVEY_ACTIVE_SOCIAL_IDENTITY_TOKEN_COLLECTION_NAME || 'kinvey_activeSocialIdentityToken';
var _sharedInstance = void 0;

/**
 * The Client class stores information regarding your application. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 *
 * @example
 * var client = new Kinvey.Client({
 *   appKey: '<appKey>',
 *   appSecret: '<appSecret>'
 * });
 */

var Client = exports.Client = function () {
  /**
   * Creates a new instance of the Client class. An `options.appKey` must be provided along with
   * either and `options.appSecret` or `options.masterSecret`.
   *
   * @param {Object}    options                             Options
   * @param {string}    [options.protocol='https']          Protocl used for requests
   * @param {string}    [options.host='baas.kinvey.com']    Host used for requests
   * @param {string}    options.appKey                      App Key
   * @param {string}    [options.appSecret]                 App Secret
   * @param {string}    [options.masterSecret]              App Master Secret
   * @param {string}    [options.encryptionKey]             App Encryption Key
   *
   * @throws {KinveyError}  If an `options.appKey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   */

  function Client() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Client);

    options = (0, _assign2.default)({
      protocol: process.env.KINVEY_API_PROTOCOL || 'https:',
      host: process.env.KINVEY_API_HOST || 'baas.kinvey.com'
    }, options);

    if (!options.appKey && !options.appId) {
      throw new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.');
    }

    if (options.hostname && (0, _isString2.default)(options.hostname)) {
      var hostnameParsed = _url2.default.parse(options.hostname);
      options.protocol = hostnameParsed.protocol;
      options.host = hostnameParsed.host;
    }

    /**
     * @type {string}
     */
    this.protocol = options.protocol;

    /**
     * @type {string}
     */
    this.host = options.host;

    /**
     * @type {string}
     */
    this.appKey = options.appKey || options.appId;

    /**
     * @type {string|undefined}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {string|undefined}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {string|undefined}
     */
    this.encryptionKey = options.encryptionKey;
  }

  _createClass(Client, [{
    key: 'getActiveUserData',
    value: function getActiveUserData() {
      return _localStorage2.default.get('' + this.appKey + activeUserCollectionName);
    }
  }, {
    key: 'setActiveUserData',
    value: function setActiveUserData(data) {
      if (data) {
        try {
          return _localStorage2.default.set('' + this.appKey + activeUserCollectionName, data);
        } catch (error) {
          return false;
        }
      }

      return _localStorage2.default.remove('' + this.appKey + activeUserCollectionName);
    }
  }, {
    key: 'getActiveSocialIdentity',
    value: function getActiveSocialIdentity() {
      return _localStorage2.default.get('' + this.appKey + activeSocialIdentityTokenCollectionName);
    }
  }, {
    key: 'setActiveSocialIdentity',
    value: function setActiveSocialIdentity(socialIdentity) {
      if (socialIdentity) {
        try {
          return _localStorage2.default.set('' + this.appKey + activeSocialIdentityTokenCollectionName, socialIdentity);
        } catch (error) {
          return false;
        }
      }

      return _localStorage2.default.remove('' + this.appKey + activeSocialIdentityTokenCollectionName);
    }

    /**
     * Returns an object containing all the information for this Client.
     *
     * @return {Object} JSON
     */

  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        protocol: this.protocol,
        host: this.host,
        appKey: this.appKey,
        appSecret: this.appSecret,
        masterSecret: this.masterSecret,
        encryptionKey: this.encryptionKey
      };

      return json;
    }

    /**
     * Initializes the library by creating a new instance of the
     * Client class and storing it as a shared instance.
     *
     * @param {Object}    options                             Options
     * @param {string}    [options.protocol='https']          Protocl used for requests
     * @param {string}    [options.host='baas.kinvey.com']    Host used for requests
     * @param {string}    options.appKey                      App Key
     * @param {string}    [options.appSecret]                 App Secret
     * @param {string}    [options.masterSecret]              App Master Secret
     * @param {string}    [options.encryptionKey]             App Encryption Key
     *
     * @throws {KinveyError}  If an `options.appKey` is not provided.
     * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
     *
     * @return {Client}  An instance of Client.
     *
     * @example
     * var client = Kinvey.Client.init({
     *   appKey: '<appKey>',
     *   appSecret: '<appSecret>'
     * });
     */

  }, {
    key: 'baseUrl',
    get: function get() {
      return _url2.default.format({
        protocol: this.protocol,
        host: this.host
      });
    }
  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      _sharedInstance = client;
      return client;
    }

    /**
     * Returns the shared client instance used by the library.
     *
     * @throws {KinveyError} If `Kinvey.init()` has not been called.
     *
     * @return {Client} The shared instance.
     */

  }, {
    key: 'sharedInstance',
    value: function sharedInstance() {
      var client = _sharedInstance;

      if (!client) {
        throw new _errors.KinveyError('You have not initialized the library. ' + 'Please call Kinvey.init() to initialize the library.');
      }

      return client;
    }
  }]);

  return Client;
}();
//# sourceMappingURL=client.js.map

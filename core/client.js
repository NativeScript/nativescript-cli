'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sharedInstanceSymbol = Symbol();

/**
 * @private
 * The Client class stores information regarding your application. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 *
 * @example
   * var client = new Kinvey.Client({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
 */

var Client = function () {
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
      protocol: process.env.KINVEY_API_PROTOCOL || 'https',
      host: process.env.KINVEY_API_HOST || 'baas.kinvey.com'
    }, options);

    if (!options.appKey && !options.appId) {
      throw new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.');
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

  /**
   * @type {string}
   */


  _createClass(Client, [{
    key: 'getUrl',
    value: function getUrl() {
      var pathname = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
      var query = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      options = (0, _assign2.default)({
        cacheBust: true
      }, options);

      query = _qs2.default.parse(query);

      if (options.cacheBust) {
        query._ = Math.random().toString(36).substr(2);
      }

      return _url2.default.format({
        protocol: this.protocol,
        host: this.host,
        pathname: pathname,
        query: query
      });
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

      return (0, _clone2.default)(json);
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

  }], [{
    key: 'init',
    value: function init(options) {
      var client = new Client(options);
      Client[sharedInstanceSymbol] = client;
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
      var client = Client[sharedInstanceSymbol];

      if (!client) {
        throw new _errors.KinveyError('You have not initialized the library. ' + 'Please call Kinvey.init() to initialize the library.');
      }

      return client;
    }
  }]);

  return Client;
}();

exports.default = Client;
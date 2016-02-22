'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _enums = require('./enums');

var _localRequest = require('./requests/localRequest');

var _localRequest2 = _interopRequireDefault(_localRequest);

var _networkRequest = require('./requests/networkRequest');

var _networkRequest2 = _interopRequireDefault(_networkRequest);

var _deltaFetchRequest = require('./requests/deltaFetchRequest');

var _deltaFetchRequest2 = _interopRequireDefault(_deltaFetchRequest);

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

var localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
var activeUserCollectionName = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var sharedInstanceSymbol = Symbol();

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
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Promise}
   */


  _createClass(Client, [{
    key: 'allAuth',
    value: function allAuth() {
      var _this = this;

      return this.sessionAuth().catch(function () {
        return _this.basicAuth();
      });
    }

    /**
     * Authenticate through App Secret.
     *
     * @returns {Promise}
     */

  }, {
    key: 'appAuth',
    value: function appAuth() {
      return Promise.resolve({
        scheme: 'Basic',
        username: this.appKey,
        password: this.appSecret
      });
    }

    /**
     * Authenticate through (1) Master Secret, or (2) App Secret.
     *
     * @returns {Promise}
     */

  }, {
    key: 'basicAuth',
    value: function basicAuth() {
      var _this2 = this;

      return this.masterAuth().catch(function () {
        return _this2.appAuth();
      });
    }

    /**
     * Authenticate through (1) user credentials, or (2) Master Secret.
     *
     * @returns {Promise}
     */

  }, {
    key: 'defaultAuth',
    value: function defaultAuth() {
      var _this3 = this;

      return this.sessionAuth().catch(function (err) {
        return _this3.masterAuth().catch(function () {
          return Promise.reject(err);
        });
      });
    }

    /**
     * Authenticate through Master Secret.
     *
     * @returns {Promise}
     */

  }, {
    key: 'masterAuth',
    value: function masterAuth() {
      if (!this.appKey || !this.masterSecret) {
        var error = new Error('Missing client credentials');
        return Promise.reject(error);
      }

      var promise = Promise.resolve({
        scheme: 'Basic',
        username: this.appKey,
        password: this.masterSecret
      });

      return promise;
    }

    /**
     * Do not authenticate.
     *
     * @returns {Promise}
     */

  }, {
    key: 'noAuth',
    value: function noAuth() {
      return Promise.resolve(null);
    }

    /**
     * Authenticate through user credentials.
     *
     * @returns {Promise}
     */

  }, {
    key: 'sessionAuth',
    value: function sessionAuth() {
      return this.getActiveUser().then(function (activeUser) {
        if (!activeUser) {
          throw new Error('There is not an active user.');
        }

        return {
          scheme: 'Kinvey',
          credentials: activeUser[kmdAttribute].authtoken
        };
      });
    }
  }, {
    key: 'getActiveUser',
    value: function getActiveUser() {
      var _this4 = this;

      var promise = Promise.resolve().then(function () {
        return _this4.executeLocalRequest({
          method: _enums.HttpMethod.GET,
          pathname: '/' + localNamespace + '/' + _this4.appKey + '/' + activeUserCollectionName
        });
      }).then(function (response) {
        var data = response.data;

        if (data.length === 0) {
          return null;
        }

        return data[0];
      }).catch(function (err) {
        if (err instanceof _errors.NotFoundError) {
          return null;
        }

        throw err;
      });

      return promise;
    }
  }, {
    key: 'setActiveUser',
    value: function setActiveUser(user) {
      var _this5 = this;

      var promise = this.getActiveUser().then(function (activeUser) {
        if (activeUser) {
          return _this5.executeLocalRequest({
            method: _enums.HttpMethod.DELETE,
            pathname: '/' + localNamespace + '/' + _this5.appKey + '/' + activeUserCollectionName + '/' + activeUser[idAttribute]
          }).then(function () {
            _this5.session = null;
          });
        }
      }).then(function () {
        if (user) {
          return _this5.executeLocalRequest({
            method: _enums.HttpMethod.POST,
            pathname: '/' + localNamespace + '/' + _this5.appKey + '/' + activeUserCollectionName,
            data: user
          });
        }
      }).then(function (response) {
        return response ? response.data : null;
      });

      return promise;
    }
  }, {
    key: 'executeLocalRequest',
    value: function executeLocalRequest() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options = (0, _assign2.default)({
        method: _enums.HttpMethod.GET,
        pathname: '/',
        flags: {
          _: Math.random().toString(36).substr(2)
        }
      }, options);
      options.flags = _qs2.default.parse(options.flags);

      var request = new _localRequest2.default({
        method: options.method,
        headers: options.headers,
        url: _url2.default.format({
          protocol: this.protocol,
          host: this.host,
          pathname: options.pathname,
          query: options.flags
        }),
        properties: options.properties,
        query: options.query,
        data: options.data,
        timeout: options.timeout
      });
      return request.execute();
    }
  }, {
    key: 'executeNetworkRequest',
    value: function executeNetworkRequest() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options = (0, _assign2.default)({
        method: _enums.HttpMethod.GET,
        pathname: '/',
        flags: {
          _: Math.random().toString(36).substr(2)
        }
      }, options);
      options.flags = _qs2.default.parse(options.flags);

      var request = new _networkRequest2.default({
        method: options.method,
        headers: options.headers,
        auth: options.auth,
        url: _url2.default.format({
          protocol: this.protocol,
          host: this.host,
          pathname: options.pathname,
          query: options.flags
        }),
        properties: options.properties,
        query: options.query,
        data: options.data,
        timeout: options.timeout
      });
      return request.execute();
    }
  }, {
    key: 'executeDeltaFetchRequest',
    value: function executeDeltaFetchRequest() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options = (0, _assign2.default)({
        method: _enums.HttpMethod.GET,
        pathname: '/',
        flags: {
          _: Math.random().toString(36).substr(2)
        }
      }, options);
      options.flags = _qs2.default.parse(options.flags);

      var request = new _deltaFetchRequest2.default({
        method: options.method,
        headers: options.headers,
        auth: options.auth,
        url: _url2.default.format({
          protocol: this.protocol,
          host: this.host,
          pathname: options.pathname,
          query: options.flags
        }),
        properties: options.properties,
        query: options.query,
        data: options.data,
        timeout: options.timeout
      });
      return request.execute();
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

      return (0, _clone2.default)(json, true);
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
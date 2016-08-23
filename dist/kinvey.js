'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Kinvey = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // eslint-disable-line no-unused-vars


var _client = require('./client');

var _endpoint = require('./endpoint');

var _utils = require('./utils');

var _query = require('./query');

var _aggregation = require('./aggregation');

var _datastore = require('./datastore');

var _entity = require('./entity');

var _social = require('./social');

var _request = require('./request');

var _errors = require('./errors');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The Kinvey class is used as the entry point for the Kinvey JavaScript SDK.
 */

var Kinvey = exports.Kinvey = function () {
  function Kinvey() {
    _classCallCheck(this, Kinvey);
  }

  _createClass(Kinvey, null, [{
    key: 'init',


    /**
     * Initializes the library with your app's information.
     *
     * @param {Object}    options                                            Options
     * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
     * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
     * @param {string}    [options.appKey]                                   App Key
     * @param {string}    [options.appSecret]                                App Secret
     * @param {string}    [options.masterSecret]                             App Master Secret
     * @param {string}    [options.encryptionKey]                            App Encryption Key
     * @param {string}    [options.appVersion]                               App Version
     * @return {Client}                                                      A client instance.
     *
     * @throws  {KinveyError}  If an `options.appKey` is not provided.
     * @throws  {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
     *
     * @example
     * var client = Kinvey.init({
     *   appKey: 'appKey',
     *   appSecret: 'appSecret'
     * });
     */
    value: function init(options) {
      // Check that an appKey or appId was provided
      if (!options.appKey) {
        throw new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      // Check that an appSecret or masterSecret was provided
      if (!options.appSecret && !options.masterSecret) {
        throw new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      // Initialize the client
      var client = _client.Client.init(options);

      // Add all the modules to the Kinvey namespace
      this.Acl = _entity.Acl;
      this.Aggregation = _aggregation.Aggregation;
      this.AuthorizationGrant = _social.AuthorizationGrant;
      this.CustomEndpoint = _endpoint.CustomEndpoint;
      this.DataStore = _datastore.DataStore;
      this.DataStoreType = _datastore.DataStoreType;
      this.Files = new _datastore.FileStore();
      this.Metadata = _entity.Metadata;
      this.Query = _query.Query;
      this.SocialIdentity = _social.SocialIdentity;
      this.Sync = _datastore.SyncManager;
      this.User = _entity.User;
      this.UserStore = _entity.UserStore;

      // Return the client
      return client;
    }

    /**
     * Pings the Kinvey API service.
     *
     * @returns {Promise<Object>} The response from the ping request.
     *
     * @example
     * var promise = Kinvey.ping().then(function(response) {
     *   console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
     * }).catch(function(error) {
     *   console.log('Kinvey Ping Failed. Response: ' + error.description);
     * });
     */

  }, {
    key: 'ping',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var client = arguments.length <= 0 || arguments[0] === undefined ? _client.Client.sharedInstance() : arguments[0];
        var request, response;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.GET,
                  authType: _request.AuthType.All,
                  url: _url2.default.format({
                    protocol: client.protocol,
                    host: client.host,
                    pathname: appdataNamespace + '/' + client.appKey
                  })
                });
                _context.next = 3;
                return request.execute();

              case 3:
                response = _context.sent;
                return _context.abrupt('return', response.data);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ping(_x) {
        return _ref.apply(this, arguments);
      }

      return ping;
    }()
  }, {
    key: 'client',

    /**
     * Returns the shared instance of the Client class used by the SDK.
     *
     * @throws {KinveyError} If a shared instance does not exist.
     *
     * @return {Client} The shared instance.
     *
     * @example
     * var client = Kinvey.client;
     */
    get: function get() {
      return _client.Client.sharedInstance();
    }

    /**
     * The version of your app. It will sent with Kinvey API requests
     * using the X-Kinvey-Api-Version header.
     *
     * @return {String} The version of your app.
     *
     * @example
     * var appVersion = Kinvey.appVersion;
     */

  }, {
    key: 'appVersion',
    get: function get() {
      return this.client.appVersion;
    }

    /**
     * Set the version of your app. It will sent with Kinvey API requests
     * using the X-Kinvey-Api-Version header.
     *
     * @param  {String} appVersion  App version.
     *
     * @example
     * Kinvey.appVersion = '1.0.0';
     * // or
     * Kinvey.appVersion = 'v1';
     */
    ,
    set: function set(appVersion) {
      this.client.appVersion = appVersion;
    }

    /**
     * Get the logging module.
     *
     * @return {Log}  The log module.
     *
     * @example
     * var Log = Kinvey.Log;
     */

  }, {
    key: 'Log',
    get: function get() {
      return _utils.Log;
    }
  }]);

  return Kinvey;
}();
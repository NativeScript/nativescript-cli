'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Kinvey = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _errors = require('./errors');

var _aggregation = require('./aggregation');

var _client = require('./client');

var _endpoint = require('./endpoint');

var _endpoint2 = _interopRequireDefault(_endpoint);

var _log = require('./log');

var _metadata = require('./metadata');

var _query = require('./query');

var _datastore = require('./stores/datastore');

var _sync = require('./sync');

var _sync2 = _interopRequireDefault(_sync);

var _user = require('./user');

var _enums = require('./enums');

var _network = require('./requests/network');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = undefined || 'appdata';
var client = null;

var Kinvey = exports.Kinvey = function () {
  function Kinvey() {
    _classCallCheck(this, Kinvey);
  }

  _createClass(Kinvey, null, [{
    key: 'init',


    /**
     * Initializes the library with your app's information.
     *
     * @param   {Object}        options                         Options
     * @param   {string}        options.appKey                Kinvey App Key
     * @param   {string}        [options.appSecret]             Kinvey App Secret
     * @param   {string}        [options.masterSecret]          Kinvey Master Secret
     * @param   {string}        [options.encryptionKey]         Your applications encryption key
     * @param   {string}        [options.hostname]              Custom Kinvey API Hostname
     * @return  {Client}                                        An instance of Client.
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
      if (!options.appKey && !options.appId) {
        throw new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      // Check that an appSecret or masterSecret was provided
      if (!options.appSecret && !options.masterSecret) {
        throw new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      // Initialize the client
      client = _client.Client.init(options);

      // Add all the modules to the Kinvey namespace
      Kinvey.Aggregation = _aggregation.Aggregation;
      Kinvey.AuthorizationGrant = _enums.AuthorizationGrant;
      Kinvey.CustomEndpoint = _endpoint2.default;
      Kinvey.DataStore = _datastore.DataStore;
      Kinvey.DataStoreType = _enums.DataStoreType;
      Kinvey.Log = _log.Log;
      Kinvey.Metadata = _metadata.Metadata;
      Kinvey.Promise = _babybird2.default;
      Kinvey.Query = _query.Query;
      Kinvey.SocialIdentity = _enums.SocialIdentity;
      Kinvey.Sync = _sync2.default;
      Kinvey.User = _user.User;

      // Return the client
      return client;
    }

    /**
     * Pings the Kinvey service.
     *
     * @returns {Promise} The response.
     */

  }, {
    key: 'ping',
    value: function ping() {
      var client = arguments.length <= 0 || arguments[0] === undefined ? _client.Client.sharedInstance() : arguments[0];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.GET,
        authType: _enums.AuthType.All,
        url: _url2.default.format({
          protocol: client.protocol,
          host: client.host,
          pathname: appdataNamespace + '/' + client.appKey
        })
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }, {
    key: 'client',
    get: function get() {
      if (!client) {
        throw new _errors.KinveyError('You have not initialized the library. ' + 'Please call Kinvey.init() to initialize the library.');
      }

      return client;
    }
  }]);

  return Kinvey;
}();
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _aggregation = require('./core/aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _client = require('./core/client');

var _client2 = _interopRequireDefault(_client);

var _command = require('./core/command');

var _command2 = _interopRequireDefault(_command);

var _filesStore = require('./core/stores/filesStore');

var _filesStore2 = _interopRequireDefault(_filesStore);

var _log = require('./core/log');

var _log2 = _interopRequireDefault(_log);

var _metadata = require('./core/metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _query = require('./core/query');

var _query2 = _interopRequireDefault(_query);

var _dataStore = require('./core/stores/dataStore');

var _dataStore2 = _interopRequireDefault(_dataStore);

var _sync = require('./core/sync');

var _sync2 = _interopRequireDefault(_sync);

var _user = require('./core/user');

var _enums = require('./core/enums');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

var Kinvey = function () {
  function Kinvey() {
    _classCallCheck(this, Kinvey);
  }

  _createClass(Kinvey, null, [{
    key: 'init',

    /**
     * Initializes the library with your app's information.
     *
     * @param   {Object}        options                         Options
     * @param   {string}        options.appKey                  My app key
     * @param   {string}        [options.appSecret]             My app secret
     * @param   {string}        [options.masterSecret]          My app's master secret
     * @param   {string}        [options.encryptionKey]         My app's encryption key
     * @param   {string}        [options.protocol]              The protocol of the client.
     * @param   {string}        [options.host]                  The host of the client.
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
      var client = _client2.default.init(options);
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
      var client = _client2.default.sharedInstance();

      return client.executeNetworkRequest({
        method: _enums.HttpMethod.GET,
        auth: client.allAuth(),
        pathname: appdataNamespace + '/' + client.appKey
      }).then(function (response) {
        return response.data;
      });
    }
  }]);

  return Kinvey;
}();

exports.default = Kinvey;


Kinvey.Aggregation = _aggregation2.default;
Kinvey.AuthorizationGrant = _enums.AuthorizationGrant;
Kinvey.Command = _command2.default;
Kinvey.DataStore = _dataStore2.default;
Kinvey.DataStoreType = _enums.DataStoreType;
Kinvey.FileStore = _filesStore2.default;
Kinvey.Log = _log2.default;
Kinvey.Metadata = _metadata2.default;
Kinvey.Promise = Promise;
Kinvey.Query = _query2.default;
Kinvey.ReadPolicy = _enums.ReadPolicy;
Kinvey.SocialIdentity = _enums.SocialIdentity;
Kinvey.Sync = _sync2.default;
Kinvey.User = _user.User;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _endpoint = require('./endpoint');

var _endpoint2 = _interopRequireDefault(_endpoint);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _utils = require('./utils');

var _aggregation = require('./aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _datastore = require('./datastore');

var _datastore2 = _interopRequireDefault(_datastore);

var _entity = require('./entity');

var _identity = require('./identity');

var _request = require('./request');

var _errors = require('./errors');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata' || 'appdata';

var Kinvey = function () {
  function Kinvey() {
    _classCallCheck(this, Kinvey);
  }

  _createClass(Kinvey, null, [{
    key: 'init',
    value: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!options.appKey) {
        throw new _errors.KinveyError('No App Key was provided.' + ' Unable to create a new Client without an App Key.');
      }

      if (!options.appSecret && !options.masterSecret) {
        throw new _errors.KinveyError('No App Secret or Master Secret was provided.' + ' Unable to create a new Client without an App Key.');
      }

      var client = _client2.default.init(options);

      return client;
    }
  }, {
    key: 'initialize',
    value: function initialize() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!options.appKey) {
        return Promise.reject(new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.'));
      }

      if (!options.appSecret && !options.masterSecret) {
        return Promise.reject(new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.'));
      }

      return _client2.default.initialize(options).then(function () {
        return _entity.User.getActiveUser();
      });
    }
  }, {
    key: 'ping',
    value: function ping() {
      var client = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _client2.default.sharedInstance();

      var request = new _request.KinveyRequest({
        method: _request.RequestMethod.GET,
        authType: _request.AuthType.All,
        url: _url2.default.format({
          protocol: client.protocol,
          host: client.host,
          pathname: appdataNamespace + '/' + client.appKey
        })
      });

      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'client',
    get: function get() {
      return _client2.default.sharedInstance();
    }
  }, {
    key: 'appVersion',
    get: function get() {
      return this.client.appVersion;
    },
    set: function set(appVersion) {
      this.client.appVersion = appVersion;
    }
  }]);

  return Kinvey;
}();

Kinvey.Acl = _entity.Acl;
Kinvey.Aggregation = _aggregation2.default;
Kinvey.AuthorizationGrant = _identity.AuthorizationGrant;
Kinvey.CustomEndpoint = _endpoint2.default;
Kinvey.DataStore = _datastore2.default;
Kinvey.DataStoreType = _datastore.DataStoreType;
Kinvey.File = _datastore.FileStore;
Kinvey.Files = _datastore.FileStore;
Kinvey.Group = _aggregation2.default;
Kinvey.Log = _utils.Log;
Kinvey.Metadata = _entity.Metadata;
Kinvey.Query = _query2.default;
Kinvey.User = _entity.User;
Kinvey.Users = _datastore.UserStore;
Kinvey.UserStore = _datastore.UserStore;

Kinvey.ActiveUserError = _errors.ActiveUserError;
Kinvey.FeatureUnavailableError = _errors.FeatureUnavailableError;
Kinvey.IncompleteRequestBodyError = _errors.IncompleteRequestBodyError;
Kinvey.InsufficientCredentialsError = _errors.InsufficientCredentialsError;
Kinvey.InvalidCredentialsError = _errors.InvalidCredentialsError;
Kinvey.InvalidIdentifierError = _errors.InvalidIdentifierError;
Kinvey.InvalidQuerySyntaxError = _errors.InvalidQuerySyntaxError;
Kinvey.JSONParseError = _errors.JSONParseError;
Kinvey.KinveyError = _errors.KinveyError;
Kinvey.MissingQueryError = _errors.MissingQueryError;
Kinvey.MissingRequestHeaderError = _errors.MissingRequestHeaderError;
Kinvey.MissingRequestParameterError = _errors.MissingRequestParameterError;
Kinvey.MobileIdentityConnectError = _errors.MobileIdentityConnectError;
Kinvey.NoNetworkConnectionError = _errors.NoNetworkConnectionError;
Kinvey.NoActiveUserError = _errors.NoActiveUserError;
Kinvey.NotFoundError = _errors.NotFoundError;
Kinvey.NoResponseError = _errors.NoResponseError;
Kinvey.ParameterValueOutOfRangeError = _errors.ParameterValueOutOfRangeError;
Kinvey.PopupError = _errors.PopupError;
Kinvey.QueryError = _errors.QueryError;
Kinvey.ServerError = _errors.ServerError;
Kinvey.SyncError = _errors.SyncError;

Kinvey.CacheRack = _request.CacheRack;
Kinvey.NetworkRack = _request.NetworkRack;
Kinvey.Rack = _request.Rack;

exports.default = Kinvey;
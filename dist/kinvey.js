'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('./client');

var _endpoint = require('./endpoint');

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

var appdataNamespace = process && process.env && process.env.KINVEY_DATASTORE_NAMESPACE || undefined || 'appdata';

var Kinvey = function () {
  function Kinvey() {
    _classCallCheck(this, Kinvey);
  }

  _createClass(Kinvey, null, [{
    key: 'init',
    value: function init(options) {
      if (!options.appKey) {
        throw new _errors.KinveyError('No App Key was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      if (!options.appSecret && !options.masterSecret) {
        throw new _errors.KinveyError('No App Secret or Master Secret was provided. ' + 'Unable to create a new Client without an App Key.');
      }

      var client = _client.Client.init(options);

      this.Files = new _datastore.FileStore();

      return client;
    }
  }, {
    key: 'ping',
    value: function ping() {
      var client = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _client.Client.sharedInstance();

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
      return _client.Client.sharedInstance();
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
Kinvey.CustomEndpoint = _endpoint.CustomEndpoint;
Kinvey.DataStore = _datastore2.default;
Kinvey.DataStoreType = _datastore.DataStoreType;
Kinvey.Log = _utils.Log;
Kinvey.Metadata = _entity.Metadata;
Kinvey.Query = _query2.default;
Kinvey.SocialIdentity = _identity.SocialIdentity;
Kinvey.User = _entity.User;
Kinvey.UserStore = _datastore.UserStore;

exports.default = Kinvey;
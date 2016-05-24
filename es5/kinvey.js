'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _aggregation = require('./aggregation');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _endpoint = require('./endpoint');

var _endpoint2 = _interopRequireDefault(_endpoint);

var _log = require('./log');

var _metadata = require('./metadata');

var _query = require('./query');

var _datastore = require('./datastore');

var _filestore = require('./filestore');

var _sync = require('./sync');

var _sync2 = _interopRequireDefault(_sync);

var _user = require('./user');

var _userstore = require('./userstore');

var _mic = require('./mic');

var _network = require('./requests/network');

var _request = require('./requests/request');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
var client = null;

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
      client = _client2.default.init(options);

      // Add all the modules to the Kinvey namespace
      this.Aggregation = _aggregation.Aggregation;
      this.AuthorizationGrant = _mic.AuthorizationGrant;
      this.CustomEndpoint = _endpoint2.default;
      this.DataStore = _datastore.DataStore;
      this.DataStoreType = _datastore.DataStoreType;
      this.FileStore = _filestore.FileStore;
      this.Log = _log.Log;
      this.Metadata = _metadata.Metadata;
      this.Query = _query.Query;
      this.SocialIdentity = _mic.SocialIdentity;
      this.Sync = _sync2.default;
      this.User = _user.User;
      this.UserStore = _userstore.UserStore;

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var client = arguments.length <= 0 || arguments[0] === undefined ? _client2.default.sharedInstance() : arguments[0];
        var request, response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                request = new _network.NetworkRequest({
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
        return ref.apply(this, arguments);
      }

      return ping;
    }()
  }, {
    key: 'client',
    get: function get() {
      if (!client) {
        throw new _errors.KinveyError('You have not initialized the library. ' + 'Please call Kinvey.init() to initialize the library.');
      }

      return client;
    }
  }, {
    key: 'appVersion',
    set: function set(appVersion) {
      this.client.appVersion = appVersion;
    }
  }]);

  return Kinvey;
}();

exports.default = Kinvey;
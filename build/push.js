'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Push = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _datastore = require('./stores/datastore');

var _network = require('./requests/network');

var _client = require('./client');

var _enums = require('./enums');

var _errors = require('./errors');

var _events = require('events');

var _user = require('./user');

var _query = require('./query');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
var notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
var deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';
var _sharedInstance = null;

var Push = exports.Push = function (_EventEmitter) {
  _inherits(Push, _EventEmitter);

  function Push() {
    _classCallCheck(this, Push);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Push).apply(this, arguments));
  }

  _createClass(Push, [{
    key: 'onNotification',
    value: function onNotification(listener) {
      return this.on(notificationEvent, listener);
    }
  }, {
    key: 'onceNotification',
    value: function onceNotification(listener) {
      return this.once(notificationEvent, listener);
    }
  }, {
    key: 'isSupported',
    value: function isSupported() {
      return false;
    }
  }, {
    key: 'getDeviceId',
    value: function getDeviceId() {
      return _babybird2.default.reject(new Error('method not supported'));
    }
  }], [{
    key: 'isSupported',
    value: function isSupported() {
      return false;
    }
  }, {
    key: 'register',
    value: function register() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!Push.isSupported()) {
        return _babybird2.default.reject(new _errors.KinveyError('Kinvey currently only supports ' + 'push notifications on iOS and Android platforms.'));
      }

      options = (0, _assign2.default)({
        force: false
      }, options);

      var promise = _sharedInstance.getDeviceId().then(function (deviceId) {
        if (!deviceId) {
          throw new _errors.KinveyError('Unable to retrieve the device id to register this device for push notifications.');
        }

        var store = _datastore.DataStore.getInstance(deviceCollectionName, _datastore.DataStoreType.Sync);
        store.disableSync();
        return store.findById(deviceId).then(function () {
          if (options.force !== true) {
            return _sharedInstance;
          }

          var user = _user.User.getActiveUser();
          var client = _client.Client.sharedInstance();
          var request = new _network.NetworkRequest({
            method: _enums.HttpMethod.POST,
            url: _url2.default.format({
              protocol: client.protocol,
              host: client.host,
              pathname: '/' + pushNamespace + '/' + client.appKey + '/register-device'
            }),
            properties: options.properties,
            authType: user ? _enums.AuthType.Session : _enums.AuthType.Master,
            data: {
              platform: global.device.platform,
              framework: 'phonegap',
              deviceId: deviceId,
              userId: user ? null : options.userId
            },
            timeout: options.timeout
          });
          return request.execute().then(function () {
            return store.save({ _id: deviceId, registered: true });
          }).then(function () {
            return _sharedInstance;
          });
        });
      });

      return promise;
    }
  }, {
    key: 'unregister',
    value: function unregister() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!Push.isSupported()) {
        return _babybird2.default.reject(new _errors.KinveyError('Kinvey currently only supports ' + 'push notifications on iOS and Android platforms.'));
      }

      var store = _datastore.DataStore.getInstance(deviceCollectionName, _datastore.DataStoreType.Sync);
      store.disableSync();
      var query = new _query.Query();
      query.equalsTo('registered', true);
      var promise = store.find(query).then(function (data) {
        if (data.length === 1) {
          return data[0]._id;
        }

        return undefined;
      }).then(function (deviceId) {
        if (!deviceId) {
          throw new _errors.KinveyError('This device has not been registered.');
        }

        var user = _user.User.getActiveUser();
        var client = _client.Client.sharedInstance();
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.POST,
          url: _url2.default.format({
            protocol: client.protocol,
            host: client.host,
            pathname: '/' + pushNamespace + '/' + client.appKey + '/unregister-device'
          }),
          properties: options.properties,
          authType: user ? _enums.AuthType.Session : _enums.AuthType.Master,
          data: {
            platform: global.device.platform,
            framework: 'phonegap',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
        return request.execute().then(function () {
          return store.removeById(deviceId).then(function () {
            return _sharedInstance;
          });
        });
      });

      return promise;
    }
  }, {
    key: 'sharedInstance',
    value: function sharedInstance() {
      return _sharedInstance;
    }
  }]);

  return Push;
}(_events.EventEmitter);

// Initialize the shared instance


_sharedInstance = new Push();
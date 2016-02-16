'use strict';

var _errors = require('./errors');

var _events = require('events');

var _networkRequest = require('./requests/networkRequest');

var _networkRequest2 = _interopRequireDefault(_networkRequest);

var _syncStore = require('./stores/syncStore');

var _syncStore2 = _interopRequireDefault(_syncStore);

var _enums = require('./enums');

var _user = require('./models/user');

var _user2 = _interopRequireDefault(_user);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _device = require('./device');

var _device2 = _interopRequireDefault(_device);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
var notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
var deviceCollection = process.env.KINVEY_DEVICE_COLLECTION || 'kinvey_device';
var emitter = new _events.EventEmitter();
var Titanium = global.Titanium;

var Push = {
  listeners: function listeners() {
    return emitter.listeners(notificationEvent);
  },
  onNotification: function onNotification(listener) {
    return emitter.on(notificationEvent, listener);
  },
  onceNotification: function onceNotification(listener) {
    return emitter.once(notificationEvent, listener);
  },
  removeListener: function removeListener(listener) {
    return emitter.removeListener(notificationEvent, listener);
  },
  removeAllListeners: function removeAllListeners() {
    return emitter.removeAllListeners(notificationEvent);
  },
  init: function init() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var device = new _device2.default();

    if (!device.isCordova() || !device.isTitanium()) {
      return Promise.reject(new _errors.KinveyError('Kinvey currently only supports push ' + 'notifications on PhoneGap/Cordova and Titanium environments.'));
    }

    if (device.platform.name !== 'android' || device.platform.name !== 'ios') {
      return Promise.reject(new _errors.KinveyError('Kinvey currently does not support ' + ('push notifications on ' + device.platform.name + '.')));
    }

    options = (0, _assign2.default)({
      android: {
        senderID: undefined
      },
      ios: {
        alert: true,
        badge: true,
        sound: true
      }
    }, options);

    var promise = new Promise(function (resolve, reject) {
      if (device.isCordova()) {
        if (typeof global.PushNotification === 'undefined') {
          return reject(new _errors.KinveyError('PhoneGap Push Notification Plugin is not installed.', 'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for ' + 'setting up your project.'));
        }

        var push = global.PushNotification.init(options);

        push.on('registration', function (data) {
          resolve(data);
        });

        push.on('notification', function (data) {
          Push.emit(notificationEvent, data);
        });

        push.on('error', function (error) {
          reject(new _errors.KinveyError('An error occurred registering this device ' + 'for push notifications.', error));
        });
      } else if (device.isTitanium()) {
        if (device.platform.name === 'ios') {
          if (device.platform.version.split('.')[0] >= 8) {
            Titanium.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {
              Titanium.App.iOS.removeEventListener('usernotificationsettings', registerForPush);
              Titanium.Network.registerForPushNotifications({
                success: function success(e) {
                  resolve(e.deviceToken);
                },
                error: function error(e) {
                  reject(new _errors.KinveyError('An error occurred registering this device ' + 'for push notifications.', e));
                },
                callback: function callback(data) {
                  Push.emit(notificationEvent, data);
                }
              });
            });

            var types = [];

            if (options.ios.alert) {
              types.push(Titanium.App.iOS.USER_NOTIFICATION_TYPE_ALERT);
            }

            if (options.ios.badge) {
              types.push(Titanium.App.iOS.USER_NOTIFICATION_TYPE_BADGE);
            }

            if (options.ios.sound) {
              types.push(Titanium.App.iOS.USER_NOTIFICATION_TYPE_SOUND);
            }

            Titanium.App.iOS.registerUserNotificationSettings({
              types: types
            });
          } else {
            var types = [];

            if (options.ios.alert) {
              types.push(Titanium.Network.NOTIFICATION_TYPE_ALERT);
            }

            if (options.ios.badge) {
              types.push(Titanium.Network.NOTIFICATION_TYPE_BADGE);
            }

            if (options.ios.sound) {
              types.push(Titanium.Network.NOTIFICATION_TYPE_SOUND);
            }

            Titanium.Network.registerForPushNotifications({
              types: [Titanium.Network.NOTIFICATION_TYPE_ALERT, Titanium.Network.NOTIFICATION_TYPE_SOUND, Titanium.Network.NOTIFICATION_TYPE_BADGE],
              success: function success(e) {
                resolve(e.deviceToken);
              },
              error: function error(e) {
                reject(new _errors.KinveyError('An error occurred registering this device for ' + 'push notifications.', e));
              },
              callback: function callback(data) {
                Push.emit(notificationEvent, data);
              }
            });
          }
        } else if (device.platform.name === 'android') {
          global.CloudPush.retrieveDeviceToken({
            success: function success(e) {
              resolve(e.deviceToken);
            },
            error: function error(e) {
              reject(new _errors.KinveyError('An error occurred registering this device for ' + 'push notifications.', e));
            }
          });

          global.CloudPush.addEventListener('callback', function (data) {
            Push.emit(notificationEvent, data);
          });
        }
      }
    }).then(function (deviceId) {
      if (!deviceId) {
        throw new _errors.KinveyError('Unable to retrieve device id to register this device for push notifications.');
      }

      return _user2.default.getActive(options).then(function (user) {
        var client = _client2.default.sharedInstance();
        var request = new _networkRequest2.default({
          method: _enums.HttpMethod.POST,
          url: client.getUrl('/' + pushNamespace + '/' + client.appKey + '/register-device'),
          properties: options.properties,
          auth: user ? _auth2.default.session : _auth2.default.master,
          data: {
            platform: device.platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
        return request.execute();
      }).then(function (result) {
        var store = new _syncStore2.default(deviceCollection);
        return store.save({
          _id: deviceId,
          registered: true
        }).then(function () {
          return result;
        });
      });
    });

    return promise;
  },
  unregister: function unregister() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    options = (0, _assign2.default)({
      client: _client2.default.sharedInstance()
    }, options);

    var device = new _device2.default();
    var platform = device.platform;

    if (!device.isCordova() || !device.isTitanium()) {
      return Promise.reject(new _errors.KinveyError('Kinvey currently only support push notifications \' +\n        \'on PhoneGap/Cordova and Titanium environments.'));
    }

    if (platform.name !== 'android' || platform.name !== 'ios') {
      return Promise.reject(new _errors.KinveyError('Kinvey currently does not support \' +\n        \'push notifications on ' + platform.name + '.'));
    }

    var store = new _syncStore2.default(deviceCollection);
    var query = new _query2.default();
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

      return _user2.default.getActive(options).then(function (user) {
        var client = _client2.default.sharedInstance();
        var request = new _networkRequest2.default({
          method: _enums.HttpMethod.POST,
          client: client,
          properties: options.properties,
          auth: user ? _auth2.default.session : _auth2.default.master,
          pathname: '/' + pushNamespace + '/' + client.appKey + '/unregister-device',
          data: {
            platform: platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
        return request.execute();
      }).then(function (result) {
        return store.removeById(deviceId).then(function () {
          return result;
        });
      });
    });

    return promise;
  }
};
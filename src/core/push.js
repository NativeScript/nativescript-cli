const KinveyError = require('./errors').KinveyError;
const EventEmitter = require('events').EventEmitter;
const Request = require('./request').Request;
const LocalStore = require('./stores/localStore');
const WritePolicy = require('./enums').WritePolicy;
const DataPolicy = require('./enums').DataPolicy;
const HttpMethod = require('./enums').HttpMethod;
const User = require('./models/user');
const Client = require('./client');
const Query = require('./query');
const Auth = require('./auth');
const Device = require('./device');
const assign = require('lodash/object/assign');
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollection = process.env.KINVEY_DEVICE_COLLECTION || 'kinvey-device';
const emitter = new EventEmitter();
const Titanium = global.Titanium;

class Push {
  static listenerCount(type) {
    return emitter.listenerCount(type);
  }

  static listeners(event) {
    return emitter.listeners(event);
  }

  static getMaxListeners() {
    return emitter.getMaxListeners();
  }

  static setMaxListeners(n) {
    return emitter.setMaxListeners(n);
  }

  static addListener(event, listener) {
    return emitter.addListener(event, listener);
  }

  static on(event, listener) {
    return emitter.on(event, listener);
  }

  static once(event, listener) {
    return emitter.once(event, listener);
  }

  static emit(event, ...args) {
    return emitter.emit(event, args);
  }

  static removeAllListeners(event) {
    return emitter.removeAllListeners(event);
  }

  static removeListener(event, listener) {
    return emitter.removeListener(event, listener);
  }

  static register(options = {}) {
    options = assign({
      client: Client.sharedInstance(),
      android: {
        senderID: undefined
      },
      ios: {
        alert: true,
        badge: true,
        sound: true
      }
    }, options);

    const device = new Device();
    const platform = device.platform;

    if (!device.isCordova() || !device.isTitanium()) {
      return Promise.reject(new KinveyError(`Kinvey currently only supports push ` +
        `notifications on PhoneGap/Cordova and Titanium environments.`));
    }

    if (platform.name !== 'android' || platform.name !== 'ios') {
      return Promise.reject(new KinveyError(`Kinvey currently does not support ` +
        `push notifications on ${platform.name}.`));
    }

    const promise = new Promise((resolve, reject) => {
      if (device.isCordova()) {
        if (typeof global.PushNotification === 'undefined') {
          return reject(new KinveyError('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to https://github.com/KinveyApps/phonegap-plugin-push#installation.'));
        }

        const push = global.PushNotification.init(options);

        push.on('registration', function (data) {
          resolve(data);
        });

        push.on('notification', function (data) {
          Push.emit(notificationEvent, data);
        });

        push.on('error', function (error) {
          reject(new KinveyError('An error occurred registering this device ' +
            'for push notifications.', error));
        });
      } else if (device.isTitanium()) {
        if (platform.name === 'ios') {
          if (platform.version.split('.')[0] >= 8) {
            Titanium.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {
              Titanium.App.iOS.removeEventListener('usernotificationsettings', registerForPush);
              Titanium.Network.registerForPushNotifications({
                success(e) {
                  resolve(e.deviceToken);
                },
                error(e) {
                  reject(new KinveyError('An error occurred registering this device ' +
                    'for push notifications.', e));
                },
                callback(data) {
                  Push.emit(notificationEvent, data);
                }
              });
            });

            const types = [];

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
            const types = [];

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
              types: [
                Titanium.Network.NOTIFICATION_TYPE_ALERT,
                Titanium.Network.NOTIFICATION_TYPE_SOUND,
                Titanium.Network.NOTIFICATION_TYPE_BADGE
              ],
              success(e) {
                resolve(e.deviceToken);
              },
              error(e) {
                reject(new KinveyError('An error occurred registering this device for ' +
                  'push notifications.', e));
              },
              callback(data) {
                Push.emit(notificationEvent, data);
              }
            });
          }
        } else if (platform.name === 'android') {
          global.CloudPush.retrieveDeviceToken({
            success(e) {
              resolve(e.deviceToken);
            },
            error(e) {
              reject(new KinveyError('An error occurred registering this device for ' +
                'push notifications.', e));
            }
          });

          global.CloudPush.addEventListener('callback', function (data) {
            Push.emit(notificationEvent, data);
          });
        }
      }
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('Unable to retrieve device id to register this device for push notifications.');
      }

      return User.getActive(options).then(user => {
        const request = new Request({
          auth: user ? Auth.session : Auth.master,
          client: options.client,
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${options.client.appId}/register-device`,
          writePolicy: WritePolicy.Network,
          data: {
            platform: platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          }
        });
        return request.execute();
      }).then(result => {
        const store = new LocalStore(deviceCollection, {
          dataPolicy: DataPolicy.LocalOnly
        });
        return store.update({
          _id: deviceId,
          registered: true
        }).then(() => {
          return result;
        });
      });
    });

    return promise;
  }

  static unregister(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const device = new Device();
    const platform = device.platform;

    if (!device.isCordova() || !device.isTitanium()) {
      return Promise.reject(new KinveyError(`Kinvey currently only support push notifications ' +
        'on PhoneGap/Cordova and Titanium environments.`));
    }

    if (platform.name !== 'android' || platform.name !== 'ios') {
      return Promise.reject(new KinveyError(`Kinvey currently does not support ' +
        'push notifications on ${platform.name}.`));
    }

    const store = new LocalStore(deviceCollection, {
      dataPolicy: DataPolicy.LocalOnly
    });
    const query = new Query();
    query.equalsTo('registered', true);
    const promise = store.find(query).then(models => {
      if (models.length >= 0) {
        return models[0].id;
      }

      return undefined;
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('This device has not been registered.');
      }

      return User.getActive(options).then(user => {
        const request = new Request({
          auth: user ? Auth.session : Auth.master,
          client: options.client,
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${options.client.appId}/unregister-device`,
          writePolicy: WritePolicy.Network,
          data: {
            platform: platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          }
        });
        return request.execute();
      }).then(result => {
        return store.delete(deviceId).then(() => {
          return result;
        });
      });
    });

    return promise;
  }

  static get NOTIFICATION_EVENT() {
    return notificationEvent;
  }
}

module.exports = Push;

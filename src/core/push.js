import { KinveyError } from './errors';
import { EventEmitter } from 'events';
import SyncStore from './stores/syncStore';
import { HttpMethod } from './enums';
import User from './models/user';
import Client from './client';
import Query from './query';
import Device from './device';
import assign from 'lodash/assign';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollection = process.env.KINVEY_DEVICE_COLLECTION || 'kinvey_device';
const emitter = new EventEmitter();
const Titanium = global.Titanium;

const Push = {
  listeners() {
    return emitter.listeners(notificationEvent);
  },

  onNotification(listener) {
    return emitter.on(notificationEvent, listener);
  },

  onceNotification(listener) {
    return emitter.once(notificationEvent, listener);
  },

  removeListener(listener) {
    return emitter.removeListener(notificationEvent, listener);
  },

  removeAllListeners() {
    return emitter.removeAllListeners(notificationEvent);
  },

  init(options = {}) {
    const device = new Device();

    if (!device.isCordova() || !device.isTitanium()) {
      return Promise.reject(new KinveyError(`Kinvey currently only supports push ` +
        `notifications on PhoneGap/Cordova and Titanium environments.`));
    }

    if (device.platform.name !== 'android' || device.platform.name !== 'ios') {
      return Promise.reject(new KinveyError(`Kinvey currently does not support ` +
        `push notifications on ${device.platform.name}.`));
    }

    options = assign({
      android: {
        senderID: undefined
      },
      ios: {
        alert: true,
        badge: true,
        sound: true
      }
    }, options);

    const promise = new Promise((resolve, reject) => {
      if (device.isCordova()) {
        if (typeof global.PushNotification === 'undefined') {
          return reject(new KinveyError('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for ' +
            'setting up your project.'));
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
        if (device.platform.name === 'ios') {
          if (device.platform.version.split('.')[0] >= 8) {
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
        } else if (device.platform.name === 'android') {
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
        const client = Client.sharedInstance();
        return client.executeNetworkRequest({
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${client.appKey}/register-device`,
          properties: options.properties,
          auth: user ? client.sessionAuth() : client.masterAuth(),
          data: {
            platform: device.platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
      }).then(response => {
        const store = new SyncStore(deviceCollection);
        return store.save({
          _id: deviceId,
          registered: true
        }).then(() => {
          return response.data;
        });
      });
    });

    return promise;
  },

  unregister(options = {}) {
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

    const store = new SyncStore(deviceCollection);
    const query = new Query();
    query.equalsTo('registered', true);
    const promise = store.find(query).then(data => {
      if (data.length === 1) {
        return data[0]._id;
      }

      return undefined;
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('This device has not been registered.');
      }

      return User.getActive(options).then(user => {
        const client = Client.sharedInstance();
        return client.executeNetworkRequest({
          method: HttpMethod.POST,
          properties: options.properties,
          auth: user ? client.sessionAuth() : client.masterAuth(),
          pathname: `/${pushNamespace}/${client.appKey}/unregister-device`,
          data: {
            platform: platform.name,
            framework: device.isCordova() ? 'phonegap' : 'titanium',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
      }).then(response => {
        return store.removeById(deviceId).then(() => {
          return response.data;
        });
      });
    });

    return promise;
  }
};

import { NetworkRequest, RequestMethod, AuthType, KinveyError, User, Client } from 'kinvey-javascript-sdk-core';
import { Device } from './device';
import { EventEmitter } from 'events';
import Promise from 'core-js/es6/promise';
import url from 'url';
import bind from 'lodash/bind';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceIdCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_deviceId';
const pushSettingsCollectionName = process.env.KINVEY_PUSH_COLLECTION_NAME || 'kinvey_pushSettings';
const storage = global.localStorage;
let notificationEventListener;

export class Push extends EventEmitter {
  constructor() {
    super();

    this.client = Client.sharedInstance();
    notificationEventListener = bind(this.notificationListener, this);

    Device.ready().then(() => {
      try {
        const pushOptions = JSON.parse(storage.getItem(pushSettingsCollectionName));
        if (pushOptions) {
          return this.register(pushOptions);
        }
      } catch (error) {
        // Cactch the JSON parsing error
      }

      return null;
    });
  }

  get pathname() {
    return `/${pushNamespace}/${this.client.appKey}`;
  }

  get client() {
    return this.pushClient;
  }

  set client(client) {
    if (!client) {
      throw new KinveyError('Kinvey.Push much have a client defined.');
    }

    this.pushClient = client;
  }

  isSupported() {
    return Device.isiOS() || Device.isAndroid();
  }

  onNotification(listener) {
    return this.on(notificationEvent, listener);
  }

  onceNotification(listener) {
    return this.once(notificationEvent, listener);
  }

  notificationListener(data) {
    this.emit(notificationEvent, data);
  }

  register(options = {}) {
    return Device.ready()
      .then(() => {
        if (!this.isSupported()) {
          return Promise.reject(new KinveyError('Kinvey currently only supports ' +
            'push notifications on iOS and Android platforms.'));
        }

        if (typeof global.PushNotification === 'undefined') {
          throw new KinveyError('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for help with ' +
            'setting up your project.');
        }

        return this.unregister().catch(() => null);
      })
      .then(() => {
        const promise = new Promise((resolve, reject) => {
          this.phonegapPush = global.PushNotification.init(options);
          this.phonegapPush.on(notificationEvent, notificationEventListener);

          this.phonegapPush.on('registration', data => {
            resolve(data.registrationId);
          });

          this.phonegapPush.on('error', error => {
            reject(new KinveyError('An error occurred registering this device for push notifications.', error));
          });

          return this.phonegapPush;
        })
        .then(deviceId => {
          if (!deviceId) {
            throw new KinveyError('Unable to retrieve the device id to register this device for push notifications.');
          }

          const user = User.getActiveUser(this.client);
          const request = new NetworkRequest({
            method: RequestMethod.POST,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/register-device`
            }),
            properties: options.properties,
            authType: user ? AuthType.Session : AuthType.Master,
            data: {
              platform: global.device.platform.toLowerCase(),
              framework: 'phonegap',
              deviceId: deviceId,
              userId: user ? undefined : options.userId
            },
            timeout: options.timeout,
            client: this.client
          });

          return request.execute()
            .then(response => {
              storage.setItem(deviceIdCollectionName, deviceId);
              storage.setItem(pushSettingsCollectionName, JSON.stringify(options));
              return response.data;
            });
        });

        return promise;
      });
  }

  unregister(options = {}) {
    return Device.ready().then(() => {
      if (!this.isSupported()) {
        return Promise.reject(new KinveyError('Kinvey currently only supports ' +
          'push notifications on iOS and Android platforms.'));
      }

      let promise = new Promise((resolve, reject) => {
        if (this.phonegapPush) {
          this.phonegapPush.off(notificationEvent, notificationEventListener);
          this.phonegapPush.unregister(() => {
            this.phonegapPush = null;
            resolve();
          }, () => {
            reject(new KinveyError('Unable to unregister with the PhoneGap Push Plugin.'));
          });
        }

        resolve();
      });

      promise = promise
        .then(() => Promise.resolve(storage.getItem(deviceIdCollectionName)))
        .then(deviceId => {
          if (!deviceId) {
            throw new KinveyError('This device has not been registered for push notifications.');
          }

          const user = User.getActiveUser(this.client);
          const request = new NetworkRequest({
            method: RequestMethod.POST,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this.pathname}/unregister-device`
            }),
            properties: options.properties,
            authType: user ? AuthType.Session : AuthType.Master,
            data: {
              platform: global.device.platform.toLowerCase(),
              framework: 'phonegap',
              deviceId: deviceId,
              userId: user ? null : options.userId
            },
            timeout: options.timeout,
            client: this.client
          });
          return request.execute();
        })
        .then(response => {
          storage.removeItem(deviceIdCollectionName);
          storage.removeItem(pushSettingsCollectionName);
          return response.data;
        });

      return promise;
    });
  }
}

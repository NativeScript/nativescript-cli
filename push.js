import { AuthType, RequestMethod, CacheReqeust, KinveyRequest } from 'kinvey-node-sdk/dist/request';
import { Client } from 'kinvey-node-sdk/dist/client';
import { User } from 'kinvey-node-sdk/dist/entity';
import Device from './device';
import { EventEmitter } from 'events';
import Promise from 'es6-promise';
import url from 'url';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';

export default class Push extends EventEmitter {
  constructor(options = {}) {
    super();
    this.client = options.client || Client.sharedInstance();
  }

  get pathname() {
    return `/${pushNamespace}/${this.client.appKey}`;
  }

  get client() {
    return this.pushClient;
  }

  set client(client) {
    if (!client) {
      throw new Error('Kinvey.Push must have a client defined.');
    }

    this.pushClient = client;
  }

  isSupported() {
    return Device.isPhoneGap() && (Device.isiOS() || Device.isAndroid());
  }

  onNotification(listener) {
    return this.on(notificationEvent, listener);
  }

  onceNotification(listener) {
    return this.once(notificationEvent, listener);
  }

  register(options = {}) {
    return Device.ready()
      .then(() => {
        if (this.isSupported() === false) {
          throw new Error('Kinvey currently only supports push notifications on iOS and Android platforms.');
        }

        if (typeof global.PushNotification === 'undefined') {
          throw new Error('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for help with'
            + ' setting up your project.');
        }

        return this.unregister()
          .catch(() => null);
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          this.phonegapPush = global.PushNotification.init(options);

          this.phonegapPush.on(notificationEvent, (data) => {
            this.emit(notificationEvent, data);
          });

          this.phonegapPush.on('registration', (data) => {
            resolve(data.registrationId);
          });

          this.phonegapPush.on('error', (error) => {
            reject(new Error('An error occurred registering this device for push notifications.', error));
          });
        });
      })
      .then((deviceId) => {
        if (typeof deviceId === 'undefined') {
          throw new Error('Unable to retrieve the device id to register this device for push notifications.');
        }

        const user = User.getActiveUser(this.client);
        const request = new KinveyRequest({
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
          .then(response => response.data)
          .then((data) => {
            const request = new CacheReqeust({
              method: RequestMethod.PUT,
              url: url.format({
                protocol: this.client.protocol,
                host: this.client.host,
                pathname: `${this.pathname}/device`
              }),
              data: {
                deviceId: deviceId
              },
              client: this.client
            });
            return request.execute()
              .then(() => data);
          });
      });
  }

  unregister(options = {}) {
    return Device.ready()
      .then(() => {
        if (this.isSupported() === false) {
          return null;
        }

        return new Promise((resolve, reject) => {
          if (this.phonegapPush) {
            this.phonegapPush.unregister(() => {
              this.phonegapPush = null;
              resolve();
            }, () => {
              reject(new Error('Unable to unregister with the PhoneGap Push Plugin.'));
            });
          }

          resolve();
        });
      })
      .then(() => {
        const request = new CacheReqeust({
          method: RequestMethod.GET,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/device`
          }),
          client: this.client
        });
        return request.execute()
          .then(response => response.data);
      })
      .then(({ deviceId }) => {
        if (typeof deviceId === 'undefined') {
          throw new Error('This device has not been registered for push notifications.');
        }

        const user = User.getActiveUser(this.client);
        const request = new KinveyRequest({
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
      .then((data) => {
        const request = new CacheReqeust({
          method: RequestMethod.DELETE,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `${this.pathname}/device`
          }),
          client: this.client
        });
        return request.execute()
          .then(() => data);
      });
  }
}

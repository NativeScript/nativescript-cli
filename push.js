import {
  AuthType,
  RequestMethod,
  KinveyRequest,
  KinveyError,
  Client,
  User,
  isDefined
} from 'kinvey-node-sdk/dist/export';
import Device from './device';
import { EventEmitter } from 'events';
import localStorage from 'local-storage';
import url from 'url';
const PUSH_NAMESPACE = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const NOTIFICATION_EVENT = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';


class Push extends EventEmitter {
  get pathname() {
    return `/${PUSH_NAMESPACE}/${this.client.appKey}`;
  }

  get client() {
    if (!this._client) {
      return Client.sharedInstance();
    }

    return this._client;
  }

  set client(client) {
    if (!(client instanceof Client)) {
      throw new Error('client must be an instance of Client.');
    }

    this._client = client;
  }

  isSupported() {
    return Device.isPhoneGap() && (Device.isiOS() || Device.isAndroid());
  }

  onNotification(listener) {
    return this.on(NOTIFICATION_EVENT, listener);
  }

  onceNotification(listener) {
    return this.once(NOTIFICATION_EVENT, listener);
  }

  register(options = {}) {
    return Device.ready()
      .then(() => {
        if (this.isSupported() === false) {
          throw new KinveyError('Kinvey currently only supports push notifications on iOS and Android platforms.');
        }

        if (isDefined(global.device) === false) {
          throw new KinveyError('Cordova Device Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for help with'
            + ' setting up your project.');
        }

        if (isDefined(global.PushNotification) === false) {
          throw new KinveyError('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for help with'
            + ' setting up your project.');
        }

        return new Promise((resolve, reject) => {
          this.phonegapPush = global.PushNotification.init(options);

          this.phonegapPush.on(NOTIFICATION_EVENT, (data) => {
            this.emit(NOTIFICATION_EVENT, data);
          });

          this.phonegapPush.on('registration', (data) => {
            resolve(data.registrationId);
          });

          this.phonegapPush.on('error', (error) => {
            reject(new KinveyError('An error occurred registering this device for push notifications.', error));
          });
        });
      })
      .then((deviceId) => {
        if (isDefined(deviceId) === false) {
          throw new KinveyError('Unable to retrieve the device id to register this device for push notifications.');
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
            const key = user ? `${this.pathname}_${user._id}` : `${this.pathname}_${options.userId}`;
            localStorage.set(key, { deviceId: deviceId });
            return data;
          });
      });
  }

  unregister(options = {}) {
    return Device.ready()
      .then(() => {
        if (this.isSupported() === false) {
          return null;
        }

        return new Promise((resolve) => {
          if (this.phonegapPush) {
            return this.phonegapPush.unregister(() => {
              this.phonegapPush = null;
              resolve();
            }, () => {
              resolve();
            });
          }

          return resolve();
        });
      })
      .then(() => {
        const user = User.getActiveUser(this.client);
        const key = user ? `${this.pathname}_${user._id}` : `${this.pathname}_${options.userId}`;
        return localStorage.get(key);
      })
      .then((pushConfig) => {
        let deviceId;

        if (isDefined(pushConfig)) {
          deviceId = pushConfig.deviceId;
        }

        if (isDefined(deviceId) === false) {
          return null;
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
            userId: user ? undefined : options.userId
          },
          timeout: options.timeout,
          client: this.client
        });
        return request.execute()
          .then(response => response.data);
      })
      .then((data) => {
        const user = User.getActiveUser(this.client);
        const key = user ? `${this.pathname}_${user._id}` : `${this.pathname}_${options.userId}`;
        localStorage.remove(key);
        return data;
      });
  }
}

// Export
export { Push };
export default new Push();

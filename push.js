import Promise from 'babybird';
import { KinveyError, NotFoundError } from 'kinvey-javascript-sdk-core/build/errors';
import { EventEmitter } from 'events';
import { DataStore, DataStoreType } from 'kinvey-javascript-sdk-core/build/stores/datastore';
import { HttpMethod, AuthType } from 'kinvey-javascript-sdk-core/build/enums';
import { User } from 'kinvey-javascript-sdk-core/build/user';
import { NetworkRequest } from 'kinvey-javascript-sdk-core/build/requests/network';
import { Client } from 'kinvey-javascript-sdk-core/build/client';
import { Query } from 'kinvey-javascript-sdk-core/build/query';
import { isiOS, isAndroid } from './utils';
import assign from 'lodash/assign';
import url from 'url';
import bind from 'lodash/bind';
import map from 'lodash/map';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
let notificationEventListener;

export class Push extends EventEmitter {
  constructor() {
    super();

    this.client = Client.sharedInstance();
    notificationEventListener = bind(this.notificationListener, this);

    const onDeviceReady = () => {
      const pushOptions = this.client.push;
      if (pushOptions) {
        this.phonegapPush = global.PushNotification.init(pushOptions);
        this.phonegapPush.on(notificationEvent, notificationEventListener);
      }

      document.removeEventListener('deviceready', onDeviceReady);
      this.deviceReady = Promise.resolve();
    };

    document.addEventListener('deviceready', bind(onDeviceReady, this), false);
    this.deviceReady = new Promise(() => {});
  }

  get _pathname() {
    return `/${pushNamespace}/${this.client.appKey}`;
  }

  get client() {
    return this._client;
  }

  set client(client) {
    if (!client) {
      throw new KinveyError('$kinvey.Push much have a client defined.');
    }

    this._client = client;
  }

  isSupported() {
    return isiOS() || isAndroid();
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
    return this.deviceReady.then(() => {
      if (!this.isSupported()) {
        return Promise.reject(new KinveyError('Kinvey currently only supports ' +
          'push notifications on iOS and Android platforms.'));
      }

      options = assign({
        force: false
      }, options);

      const promise = new Promise((resolve, reject) => {
        if (!global.PushNotification) {
          return reject(new KinveyError('PhoneGap Push Notification Plugin is not installed.',
            'Please refer to http://devcenter.kinvey.com/phonegap-v3.0/guides/push#ProjectSetUp for help with ' +
            'setting up your project.'));
        }

        return global.PushNotification.hasPermission(data => {
          if (!data.isEnabled) {
            return reject(new KinveyError('Permission for push notifications has not been granted by the user.'));
          }

          if (this.phonegapPush) {
            this.phonegapPush.off(notificationEvent, notificationEventListener);
          }

          this.phonegapPush = global.PushNotification.init(options);
          this.phonegapPush.on(notificationEvent, notificationEventListener);

          this.phonegapPush.on('registration', data => {
            resolve(data.registrationId);
          });

          this.phonegapPush.on('error', error => {
            reject(new KinveyError('An error occurred registering this device for push notifications.', error));
          });
          return promise;
        });
      }).then(deviceId => {
        if (!deviceId) {
          throw new KinveyError('Unable to retrieve the device id to register this device for push notifications.');
        }

        const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
        store.client = this.client;
        store.disableSync();
        return store.findById(deviceId).catch(error => {
          if (error instanceof NotFoundError) {
            return undefined;
          }

          throw error;
        }).then(entity => {
          if (entity && options.force !== true) {
            return entity;
          }

          const user = User.getActiveUser(this.client);
          const request = new NetworkRequest({
            method: HttpMethod.POST,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this._pathname}/register-device`
            }),
            properties: options.properties,
            authType: user ? AuthType.Session : AuthType.Master,
            data: {
              platform: global.device.platform.toLowerCase(),
              framework: 'phonegap',
              deviceId: deviceId,
              userId: user ? undefined : options.userId
            },
            timeout: options.timeout
          });
          return request.execute().then(() => store.save({ _id: deviceId, registered: true })).then(() => {
            this.client.push = options;
          });
        });
      });

      return promise;
    });
  }

  unregister(options = {}) {
    return this.deviceReady.then(() => {
      if (!this.isSupported()) {
        return Promise.reject(new KinveyError('Kinvey currently only supports ' +
          'push notifications on iOS and Android platforms.'));
      }

      const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
      store.client = this.client;
      store.disableSync();

      let promise = new Promise((resolve, reject) => {
        if (this.phonegapPush) {
          this.phonegapPush.unregister(() => {
            this.phonegapPush = null;
            resolve();
          }, () => {
            reject(new KinveyError('Unable to unregister with the PhoneGap Push Plugin.'));
          });
        }

        resolve();
      });

      promise = promise.then(() => {
        const query = new Query();
        query.equalTo('registered', true);
        return store.find(query);
      }).then(entities => {
        if (!entities.length === 0) {
          throw new KinveyError('This device has not been registered for push notifications.');
        }

        const user = User.getActiveUser(this.client);
        const promises = map(entities, entity => {
          const deviceId = entity[idAttribute];
          const request = new NetworkRequest({
            method: HttpMethod.POST,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `${this._pathname}/unregister-device`
            }),
            properties: options.properties,
            authType: user ? AuthType.Session : AuthType.Master,
            data: {
              platform: global.device.platform.toLowerCase(),
              framework: 'phonegap',
              deviceId: deviceId,
              userId: user ? null : options.userId
            },
            timeout: options.timeout
          });
          return request.execute().then(() => store.removeById(deviceId));
        });
        return Promise.all(promises);
      }).then(() => {
        this.client.push = null;
      });

      return promise;
    });
  }
}

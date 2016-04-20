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
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';

export class Push extends EventEmitter {
  constructor() {
    super();

    this.client = Client.sharedInstance();
    this.eventListeners = {
      notificationListener: bind(this.notificationListener, this)
    };

    const pushOptions = this.client.push;
    if (pushOptions && typeof global.PushNotification === 'undefined') {
      this.phonegapPush = global.PushNotification.init(pushOptions);
      this.phonegapPush.on(notificationEvent, this.eventListeners.notificationListener);
    }
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
    if (!this.isSupported()) {
      return Promise.reject(new KinveyError('Kinvey currently only supports ' +
        'push notifications on iOS and Android platforms.'));
    }

    options = assign({
      android: {
        senderID: undefined
      },
      ios: {
        alert: true,
        badge: true,
        sound: true
      },
      force: false
    }, options);

    const promise = new Promise((resolve, reject) => {
      if (typeof global.PushNotification === 'undefined') {
        return reject(new KinveyError('PhoneGap Push Notification Plugin is not installed.',
          'Please refer to http://devcenter.kinvey.com/phonegap-v3.0/guides/push#ProjectSetUp for help with ' +
          'setting up your project.'));
      }

      if (this.phonegapPush) {
        this.phonegapPush.off(notificationEvent, this.eventListeners.notificationListener);
      }

      return global.PushNotification.hasPermission(data => {
        if (!data.isEnabled) {
          return reject(new KinveyError('Permission for push notifications has not been granted by the user.'));
        }

        this.phonegapPush = global.PushNotification.init(options);

        this.phonegapPush.on('registration', data => {
          resolve(data.registrationId);
        });

        this.phonegapPush.on('error', error => {
          reject(new KinveyError('An error occurred registering this device for push notifications.', error));
        });

        return this;
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
          this.phonegapPush.on(notificationEvent, this.eventListeners.notificationListener);
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
        return request.execute().then(() => store.save({ _id: deviceId, registered: true })).then(response => {
          this.phonegapPush.on(notificationEvent, this.eventListeners.notificationListener);
          this.client.push = options;
          return response;
        });
      });
    });

    return promise;
  }

  unregister(options = {}) {
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
      query.equalsTo('registered', true);
      return store.find(query);
    }).then(data => {
      if (data.length === 1) {
        return data[0]._id;
      }

      return undefined;
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('This device has not been registered for push notifications.');
      }

      const user = User.getActiveUser(this.client);
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
      return request.execute().then(response => store.removeById(deviceId).then(() => {
        this.client.push = null;
        return response.data;
      }));
    });

    return promise;
  }
}

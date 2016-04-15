import { KinveyError } from 'kinvey-javascript-sdk-core/build/errors';
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
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';
const emitter = new EventEmitter();

export class Push {
  static listeners() {
    return emitter.listeners(notificationEvent);
  }

  static onNotification(listener) {
    return emitter.on(notificationEvent, listener);
  }

  static onceNotification(listener) {
    return emitter.once(notificationEvent, listener);
  }

  static removeListener(listener) {
    return emitter.removeListener(notificationEvent, listener);
  }

  static removeAllListeners() {
    return emitter.removeAllListeners(notificationEvent);
  }

  static isSupported() {
    return isiOS() || isAndroid();
  }

  static init(options = {}) {
    if (!Push.isSupported()) {
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
          'Please refer to http://devcenter.kinvey.com/phonegap/guides/push#ProjectSetUp for ' +
          'setting up your project.'));
      }

      const push = global.PushNotification.init(options);

      push.on('registration', data => {
        resolve(data);
      });

      push.on('notification', data => {
        Push.emit(notificationEvent, data);
      });

      push.on('error', error => {
        reject(new KinveyError('An error occurred registering this device for push notifications.', error));
      });

      return push;
    }).then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('Unable to retrieve the device id to register this device for push notifications.');
      }

      const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
      store.disableSync();
      return store.findById(deviceId).then(entity => {
        if (options.force !== true) {
          return entity;
        }

        const user = User.getActiveUser();
        const client = Client.sharedInstance();
        const request = new NetworkRequest({
          method: HttpMethod.POST,
          url: url.format({
            protocol: client.protocol,
            host: client.host,
            pathname: `/${pushNamespace}/${client.appKey}/register-device`
          }),
          properties: options.properties,
          authType: user ? AuthType.Session : AuthType.Master,
          data: {
            platform: global.device.platform,
            framework: 'phonegap',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
        return request.execute().then(() => store.save({ _id: deviceId, registered: true }));
      });
    });

    return promise;
  }

  static unregister(options = {}) {
    if (!Push.isSupported()) {
      return Promise.reject(new KinveyError('Kinvey currently only supports ' +
        'push notifications on iOS and Android platforms.'));
    }

    const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
    store.disableSync();
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

      const user = User.getActiveUser();
      const request = new NetworkRequest({
        method: HttpMethod.POST,
        url: url.format({
          protocol: client.protocol,
          host: client.host,
          pathname: `/${pushNamespace}/${client.appKey}/unregister-device`
        }),
        properties: options.properties,
        authType: user ? AuthType.Session : AuthType.Master,
        data: {
          platform: global.device.platform,
          framework: 'phonegap',
          deviceId: deviceId,
          userId: user ? null : options.userId
        },
        timeout: options.timeout
      });
      return request.execute().then(response => store.removeById(deviceId).then(() => response.data));
    });

    return promise;
  }
}

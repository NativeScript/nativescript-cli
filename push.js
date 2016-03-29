import { KinveyError } from 'kinvey-javascript-sdk-core/src/errors';
import { EventEmitter } from 'events';
import { DataStore, DataStoreType } from 'kinvey-javascript-sdk-core/src/stores/dataStore';
import { HttpMethod } from 'kinvey-javascript-sdk-core/src/enums';
import { User } from 'kinvey-javascript-sdk-core/src/user';
import { Client } from 'kinvey-javascript-sdk-core/src/client';
import { Query } from 'kinvey-javascript-sdk-core/src/query';
import { isiOS, isAndroid } from './utils';
import assign from 'lodash/assign';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';
const emitter = new EventEmitter();

export const Push = {
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
    if (!isiOS() || !isAndroid()) {
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
      return store.findById(deviceId).then(entity => {
        if (options.force !== true && entity.registered) {
          throw new KinveyError('Device is already registered. To force registration ' +
            'please set options.force to true.');
        }
      }).then(() => {
        const user = User.getActiveUser();
        const client = Client.sharedInstance();
        return client.executeNetworkRequest({
          method: HttpMethod.POST,
          pathname: `/${pushNamespace}/${client.appKey}/register-device`,
          properties: options.properties,
          auth: user ? client.sessionAuth() : client.masterAuth(),
          data: {
            platform: global.device.platform,
            framework: 'phonegap',
            deviceId: deviceId,
            userId: user ? null : options.userId
          },
          timeout: options.timeout
        });
      }).then(response => store.save({ _id: deviceId, registered: true }).then(() => response.data));
    });

    return promise;
  },

  unregister(options = {}) {
    if (!isiOS() || !isAndroid()) {
      return Promise.reject(new KinveyError('Kinvey currently only supports ' +
        'push notifications on iOS and Android platforms.'));
    }

    const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
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
      const client = Client.sharedInstance();
      return client.executeNetworkRequest({
        method: HttpMethod.POST,
        properties: options.properties,
        auth: user ? client.sessionAuth() : client.masterAuth(),
        pathname: `/${pushNamespace}/${client.appKey}/unregister-device`,
        data: {
          platform: global.device.platform,
          framework: 'phonegap',
          deviceId: deviceId,
          userId: user ? null : options.userId
        },
        timeout: options.timeout
      }).then(response => store.removeById(deviceId).then(() => response.data));
    });

    return promise;
  }
};

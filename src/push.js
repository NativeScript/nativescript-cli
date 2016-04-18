import Promise from 'babybird';
import { DataStore, DataStoreType } from './stores/datastore';
import { NetworkRequest } from './requests/network';
import { Client } from './client';
import { AuthType, HttpMethod } from './enums';
import { KinveyError } from './errors';
import { EventEmitter } from 'events';
import { User } from './user';
import { Query } from './query';
import url from 'url';
import assign from 'lodash/assign';
const pushNamespace = process.env.KINVEY_PUSH_NAMESPACE || 'push';
const notificationEvent = process.env.KINVEY_NOTIFICATION_EVENT || 'notification';
const deviceCollectionName = process.env.KINVEY_DEVICE_COLLECTION_NAME || 'kinvey_device';
let sharedInstance = null;

export class Push extends EventEmitter {
  onNotification(listener) {
    return this.on(notificationEvent, listener);
  }

  onceNotification(listener) {
    return this.once(notificationEvent, listener);
  }

  isSupported() {
    return false;
  }

  getDeviceId() {
    return Promise.reject(new Error('method not supported'));
  }

  static isSupported() {
    return false;
  }

  static register(options = {}) {
    if (!Push.isSupported()) {
      return Promise.reject(new KinveyError('Kinvey currently only supports ' +
        'push notifications on iOS and Android platforms.'));
    }

    options = assign({
      force: false
    }, options);

    const promise = sharedInstance.getDeviceId().then(deviceId => {
      if (!deviceId) {
        throw new KinveyError('Unable to retrieve the device id to register this device for push notifications.');
      }

      const store = DataStore.getInstance(deviceCollectionName, DataStoreType.Sync);
      store.disableSync();
      return store.findById(deviceId).then(() => {
        if (options.force !== true) {
          return sharedInstance;
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
        return request.execute().then(() => store.save({ _id: deviceId, registered: true })).then(() => sharedInstance);
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
      const client = Client.sharedInstance();
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
      return request.execute().then(() => store.removeById(deviceId).then(() => sharedInstance));
    });

    return promise;
  }

  static sharedInstance() {
    return sharedInstance;
  }
}

// Initialize the shared instance
sharedInstance = new Push();

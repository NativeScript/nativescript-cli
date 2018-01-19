import { Promise } from 'es6-promise';
import { EventEmitter } from 'events';

import { device as Device } from 'tns-core-modules/platform';
import { Client } from '../../core/client';
import { KinveyError, NotFoundError } from '../../core/errors';
import { isDefined } from '../../core/utils';
import { User } from '../../core/user';
import { AuthType, KinveyRequest, RequestMethod } from '../../core/request';
import { PushConfig } from './';
import { repositoryProvider } from '../../core/datastore';

const deviceCollectionName = '__device';

export class PushCommon extends EventEmitter {
  private _client: Client;
  private _offlineRepoPromise: Promise<any>;

  get client() {
    if (isDefined(this._client) === false) {
      return Client.sharedInstance();
    }

    return this._client;
  }

  set client(client) {
    if (isDefined(client) && (client instanceof Client) === false) {
      throw new Error('client must be an instance of Client.');
    }

    this._client = client;
  }

  onNotification(listener: (data: any) => void) {
    return (this as any).on('notification', listener);
  }

  onceNotification(listener: (data: any) => void) {
    return (this as any).once('notification', listener);
  }

  register(options = <PushConfig>{}) {
    return this._registerWithPushPlugin(options)
      .then((token) => {
        if (isDefined(token) === false) {
          throw new KinveyError('Unable to retrieve the device token to register this device for push notifications.');
        }

        return this._registerWithKinvey(token, options);
      })
      .then((token) => {
        return this._saveTokenToCache(token, options);
      });
  }

  unregister(options = <PushConfig>{}) {
    return this._unregisterWithPushPlugin(options)
      .then(() => {
        return this._getTokenFromCache(options);
      })
      .then((token) => {
        if (isDefined(token) === false) {
          throw new KinveyError('Unable to retrieve the device token to unregister this device for push notifications.');
        }

        return this._unregisterWithKinvey(token, options);
      })
      .then(() => {
        return this._deleteTokenFromCache(options);
      });
  }

  protected _registerWithPushPlugin(options = <PushConfig>{}): Promise<string> {
    return Promise.reject(new KinveyError('Unable to register for push notifications.'));
  }

  protected _unregisterWithPushPlugin(options = <PushConfig>{}): Promise<null> {
    return Promise.reject(new KinveyError('Unable to unregister for push notifications.'));
  }

  private _registerWithKinvey(token: string, options = <PushConfig>{}): Promise<string> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(new KinveyError('Unable to register this device for push notifications.',
        'You must login a user.'));
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      url: `${this.client.apiHostname}/push/${this.client.appKey}/register-device`,
      authType: activeUser ? AuthType.Session : AuthType.Master,
      data: {
        platform: Device.os.toLowerCase(),
        framework: 'nativescript',
        deviceId: token
      },
      timeout: options.timeout,
      client: this.client
    });
    return request.execute().then(() => token);
  }

  private _unregisterWithKinvey(token: string, options = <PushConfig>{}): Promise<string> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      return Promise.reject(new KinveyError('Unable to unregister this device for push notifications.',
        'You must login a user.'));
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      url: `${this.client.apiHostname}/push/${this.client.appKey}/unregister-device`,
      authType: isDefined(activeUser) ? AuthType.Session : AuthType.Master,
      data: {
        platform: Device.os.toLowerCase(),
        framework: 'nativescript',
        deviceId: token
      },
      timeout: options.timeout,
      client: this.client
    });
    return request.execute().then(response => response.data);
  }

  private _getTokenFromCache(options = <PushConfig>{}): Promise<string | null> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      throw new KinveyError('Unable to retrieve device token.',
        'You must login a user.');
    }

    return this._getOfflineRepo()
      .then(repo => repo.readById(deviceCollectionName, activeUser._id))
      .catch((error) => {
        if (error instanceof NotFoundError) {
          return {} as any;
        }

        throw error;
      })
      .then((device) => {
        if (isDefined(device)) {
          return device.token;
        }

        return null;
      });
  }

  private _saveTokenToCache(token: any, options = <PushConfig>{}): Promise<string> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      throw new KinveyError('Unable to save device token.',
        'You must login a user.');
    }

    const device = {
      userId: activeUser._id,
      token: token
    };

    return this._getOfflineRepo()
      .then(repo => repo.update(deviceCollectionName, device))
      .then(() => token);
  }

  private _deleteTokenFromCache(options = <PushConfig>{}): Promise<null> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      throw new KinveyError('Unable to delete device token.',
        'You must login a user.');
    }

    return this._getOfflineRepo()
      .then((repo) => repo.deleteById(deviceCollectionName, activeUser._id))
      .then(() => null);
  }

  private _getOfflineRepo() {
    if (!this._offlineRepoPromise) {
      this._offlineRepoPromise = repositoryProvider.getOfflineRepository();
    }
    return this._offlineRepoPromise;
  }
}

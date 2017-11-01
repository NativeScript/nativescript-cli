import { Promise } from 'es6-promise';
import { EventEmitter } from 'events';
import { device as Device } from 'platform';
import Client from 'kinvey-js-sdk/dist/client';
import { KinveyError, NotFoundError } from 'kinvey-js-sdk/dist/errors';
import { isDefined } from 'kinvey-js-sdk/dist/utils';
import { User } from 'kinvey-js-sdk/dist/entity';
import { AuthType, CacheRequest, KinveyRequest, RequestMethod } from 'kinvey-js-sdk/dist/request';
import { PushConfig } from './';

export class PushCommon extends EventEmitter {
  private _client: Client;

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

  private _getTokenFromCache(options = <PushConfig>{}): Promise<string|null> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      throw new KinveyError('Unable to retrieve device token.',
        'You must login a user.');
    }

    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device/${activeUser._id}`,
      client: this.client
    });
    return request.execute()
      .catch((error) => {
        if (error instanceof NotFoundError) {
          return {};
        }

        throw error;
      })
      .then(response => response.data)
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

    const request = new CacheRequest({
      method: RequestMethod.PUT,
      url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device`,
      data: {
        userId: activeUser._id,
        token: token
      },
      client: this.client
    });
    return request.execute().then(() => token);
  }

  private _deleteTokenFromCache(options = <PushConfig>{}): Promise<null> {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) === false) {
      throw new KinveyError('Unable to delete device token.',
        'You must login a user.');
    }

    const request = new CacheRequest({
      method: RequestMethod.DELETE,
      url: `${this.client.apiHostname}/appdata/${this.client.appKey}/__device/${activeUser._id}`,
      client: this.client
    });
    return request.execute()
      .catch((error) => {
        if (error instanceof NotFoundError) {
          return {};
        }

        throw error;
      })
      .then(() => null);
  }
}

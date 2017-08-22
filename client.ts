import isString from 'lodash/isString';
import { Client as CoreClient, KinveyError, isDefined } from 'kinvey-js-sdk/dist/export';
import Log from 'kinvey-js-sdk/dist/utils';
import { SecureStorage } from './secure';
const storage = new SecureStorage();

class ActiveUserStorage {
  get(key) {
    if (!isString(key)) {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    try {
      return JSON.parse(storage.get(key));
    } catch (e) {
      Log.debug('Unable to parse stored active user.', e);
      return null;
    }
  }

  set(key, value) {
    if (!isString(key)) {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    if (isDefined(value)) {
      storage.set(key, JSON.stringify(value));
    } else {
      storage.remove(key);
    }

    return value;
  }
}

export class Client extends CoreClient {
  static init(config) {
    const client = CoreClient.init(config);
    client.activeUserStorage = new ActiveUserStorage();
    return client;
  }
}

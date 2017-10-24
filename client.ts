import { Client as CoreClient, KinveyError, isDefined, Log } from 'kinvey-js-sdk/dist/export';
import { SecureStorage } from './secure';
const storage = new SecureStorage();

class ActiveUserStorage {
  get(key: string) {
    if (typeof key !== 'string') {
      throw new KinveyError('The key argument must be a string.');
    }

    try {
      return JSON.parse(storage.get(key));
    } catch (e) {
      Log.debug('Unable to parse stored active user.', e);
      return null;
    }
  }

  set(key: string, value: string|Object) {
    if (typeof key !== 'string') {
      throw new KinveyError('The key argument must be a string.');
    }

    if (value !== null && value !== undefined && typeof value === 'object') {
      value = JSON.stringify(value);
    }

    if (value !== null && value !== undefined && typeof value !== 'string') {
      value = String(value);
    }

    if (isDefined(value)) {
      storage.set(key, value);
    } else {
      this.remove(key);
    }

    return value;
  }

  remove(key: string) {
    if (typeof key !== 'string') {
      throw new KinveyError('The key argument must be a string.');
    }

    storage.remove(key);
    return null;
  }
}

export class Client extends CoreClient {
  static init(config) {
    const client = CoreClient.init(config);
    client.activeUserStorage = new ActiveUserStorage();
    return client;
  }
}

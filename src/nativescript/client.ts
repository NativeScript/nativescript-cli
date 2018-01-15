import { Client as CoreClient } from '../core/client';
import { KinveyError } from '../core/errors';
import { isDefined } from '../core/utils';
import { Log } from '../core/log';
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

  static sharedInstance() {
    return super.sharedInstance();
  }
}

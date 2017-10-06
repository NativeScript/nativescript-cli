import storage from 'local-storage-fallback';
import CoreClient from '../../core/src/client';
import { KinveyError } from '../../core/src/errors';
import { Log, isDefined } from '../../core/src/utils';

class ActiveUserStorage {
  get(key) {
    if (typeof key !== 'string') {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    try {
      return JSON.parse(storage.getItem(key));
    } catch (e) {
      Log.debug('Unable to parse stored active user.', e);
      return null;
    }
  }

  set(key, value) {
    if (typeof key !== 'string') {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    if (isDefined(value)) {
      storage.setItem(key, JSON.stringify(value));
    } else {
      storage.removeItem(key);
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

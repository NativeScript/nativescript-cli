import cloneDeep from 'lodash/cloneDeep';

import { storage } from 'local-storage-fallback';
import { Client } from '../core/client';
import { KinveyError } from '../core/errors';
import { Log } from '../core/log';
import { isDefined, useIfDefined } from '../core/utils';
import { StorageProvider } from '../core/datastore';

const defaultHtml5StorageProviderPrecedence = [
  StorageProvider.WebSQL,
  StorageProvider.IndexedDB,
  StorageProvider.LocalStorage,
  StorageProvider.SessionStorage
];

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

export class Html5Client extends Client {
  static init(config) {
    config = cloneDeep(config);
    config.storage = useIfDefined(config.storage, defaultHtml5StorageProviderPrecedence);
    const client = Client.init(config);
    client.activeUserStorage = new ActiveUserStorage();
    return client;
  }
}

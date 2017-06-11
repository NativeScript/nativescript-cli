import MemoryCache from 'fast-memory-cache';
import isFunction from 'lodash/isFunction';

import Client from 'src/client';
import { isDefined } from 'src/utils';

let storage = new MemoryCache();
const ActiveUserHelper = {
  get(client = Client.sharedInstance()) {
    let value = storage.get(client.appKey);

    try {
      value = JSON.parse(value);
    } catch (e) {
        // Catch exception
    }

    return value;
  },

  set(client = Client.sharedInstance(), activeUser) {
    this.remove(client);

    if (isDefined(activeUser)) {
      storage.set(client.appKey, JSON.stringify(activeUser));
    }

    return activeUser;
  },

  remove(client = Client.sharedInstance()) {
    if (isFunction(storage.remove)) {
      storage.remove(client.appKey);
    } else if (isFunction(storage.delete)) {
      storage.delete(client.appKey);
    }
  },

  useStorage(StorageClass) {
    storage = new StorageClass();
  }
};

export { ActiveUserHelper };

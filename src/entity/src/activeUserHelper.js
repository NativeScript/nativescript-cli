import MemoryCache from 'fast-memory-cache';
import isFunction from 'lodash/isFunction';

import Client from 'src/client';
import { isDefined } from 'src/utils';

const memory = new MemoryCache();
let storage = new MemoryCache();

const ActiveUserHelper = {
  load(client = Client.sharedInstance()) {
    return new Promise((resolve) => {
      resolve(storage.get(client.appKey));
    })
      .then((value) => {
        try {
          value = JSON.parse(value);
        } catch (e) {
            // Catch exception
        }

        return value;
      })
      .then((activeUser) => {
        return this.set(client, activeUser);
      });
  },

  get(client = Client.sharedInstance()) {
    let value = memory.get(client.appKey);

    try {
      value = JSON.parse(value);
    } catch (e) {
        // Catch exception
    }

    return value;
  },

  set(client = Client.sharedInstance(), activeUser) {
    if (isDefined(activeUser)) {
      // Set in memory
      memory.set(client.appKey, JSON.stringify(activeUser));

      // Set in storage
      return new Promise((resolve) => {
        resolve(storage.set(client.appKey, JSON.stringify(activeUser)));
      })
        .then(() => activeUser);
    }

    return this.remove(client);
  },

  remove(client = Client.sharedInstance()) {
    // Delete it from memory
    memory.delete(client.appKey);

    return new Promise((resolve) => {
      // Delete from storage
      if (isFunction(storage.remove)) {
        return resolve(storage.remove(client.appKey));
      } else if (isFunction(storage.delete)) {
        return resolve(storage.delete(client.appKey));
      }

      return resolve(null);
    })
      .then(() => null);
  },

  useStorage(StorageClass) {
    storage = new StorageClass();
  }
};

export { ActiveUserHelper };

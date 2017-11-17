const { storage } = require('local-storage-fallback');
const { Client } = require('kinvey-client');
const { KinveyError } = require('kinvey-errors');
const { Log } = require('kinvey-log');
const { isDefined } = require('kinvey-utils/object');

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

class Html5Client extends Client {
  static init(config) {
    const client = Client.init(config);
    client.activeUserStorage = new ActiveUserStorage();
    return client;
  }
}
exports.Client = Html5Client;

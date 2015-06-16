import KinveyCache from 'kinvey-cache';
import Kinvey from '../kinvey';

class Cache extends KinveyCache {
  static generateKeyHash(key) {
    return key;
  }

  static get(key) {
    let keyHash = Cache.generateKeyHash(key);
    let cache = Cache.instance();
    return cache.get(keyHash);
  }

  static set(key, data, time) {
    let keyHash = Cache.generateKeyHash(key);
    let cache = Cache.instance();
    return cache.set(keyHash, data, time);
  }

  static remove(key) {
    let keyHash = Cache.generateKeyHash(key);
    let cache = Cache.instance();
    return cache.remove(keyHash);
  }

  static instance() {
    return super.instance(`Kinvey.${Kinvey.appKey}`);
  }
}

export default Cache;

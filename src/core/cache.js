import NodeCache from 'node-cache';
import {isDefined} from '../utils';
import sha1 from 'crypto-js/sha1';
import log from 'loglevel';
import Kinvey from '../kinvey';
import localStorage from 'humble-localstorage';
const privateCacheSymbol = Symbol();
const sharedInstanceSymbol = Symbol();

class PrivateCache extends NodeCache {
  // Prefix for all keys
  get cachePrefix() {
    return 'Kinvey-';
  }

  // Suffix for the key name on the expiration items
  get cacheSuffix() {
    return '-cacheexpiration';
  }

  // Expiration date radix (set to Base-36 for most space savings)
  get expiryRadix() {
    return 10;
  }

  // Time resolution in minutes
  get expiryUnits() {
    return 60 * 1000;
  }

  // ECMAScript max Date (epoch + 1e8 days)
  get maxDate() {
    return Math.floor(8.64e15 / this.expiryUnits);
  }

  /**
   * Returns the number of minutes since the epoch.
   * @return {number}
   */
  get currentTime() {
    return Math.floor(new Date().getTime() / this.expiryUnits);
  }

  constructor(name = '') {
    super();
    this.name = name;
  }

  hashKey(key) {
    return sha1(key).toString();
  }

  isOutOfSpace(e) {
    if (isDefined(e) && e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.name === 'QuotaExceededError') {
      return true;
    }

    return false;
  }

  /**
   * Returns a string where all RegExp special characters are escaped with a \.
   * @param {String} text
   * @return {string}
   */
  escapeRegExpSpecialCharacters(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  eachKey(fn) {
    const prefixRegExp = new RegExp(`^${this.cachePrefix}${this.escapeRegExpSpecialCharacters(this.bucket)}(.*)`);

    // Loop in reverse as removing items will change indices of tail
    for (let i = localStorage.length - 1; i >= 0; --i) {
      let key = localStorage.key(i);
      key = key && key.match(prefixRegExp);
      key = key && key[1];
      if (isDefined(key) && key.indexOf(this.cacheSuffix) < 0) {
        fn(key, this.expirationKey(key));
      }
    }
  }

  get(key) {
    const hash = this.hashKey(key);
    let value = super.get(hash);

    // Try to retrieve the stored value
    if (!isDefined(value)) {
      // Get the value from local storage
      value = this.getItem(hash);

      if (isDefined(value)) {
        // Parse the value
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value;
        }

        // Store the value
        this.set(key, value);
      }
    }

    // Return the value
    return value;
  }

  getItem(key) {
    return localStorage.getItem(`${this.cachePrefix}${this.bucket}${key}`);
  }

  set(key, value, time) {
    const hash = this.hashKey(key);
    const success = super.set(key, value);

    if (success) {
      if (typeof value !== 'string') {
        // Serialize the value
        try {
          value = JSON.stringify(value);
        } catch (e) {
          // Sometimes we can't stringify due to circular refs
          // in complex objects, so we won't bother storing then.
          return false;
        }
      }

      try {
        this.setItem(hash, value);
      } catch (err) {
        if (this.isOutOfSpace(err)) {
          // If we exceeded the quota, then we will sort
          // by the expire time, and then remove the N oldest
          const storedKeys = [];
          let storedKey;

          this.eachKey((key, exprKey) => {
            let expiration = this.getItem(exprKey);

            if (expiration) {
              expiration = parseInt(expiration, this.expiryRadix);
            } else {
              // TODO: Store date added for non-expiring items for smarter removal
              expiration = this.maxDate;
            }

            storedKeys.push({
              key: key,
              size: (this.getItem(key) || '').length,
              expiration: expiration
            });
          });

          // Sorts the keys with oldest expiration time last
          storedKeys.sort(function sort(a, b) {
            return b.expiration - a.expiration;
          });

          let targetSize = (value || '').length;
          while (storedKeys.length && targetSize > 0) {
            storedKey = storedKeys.pop();
            log.warn(`Cache is full, removing item with key ${'}${key}${'}.`);
            this.flushItem(storedKey.key);
            targetSize -= storedKey.size;
          }

          try {
            this.setItem(hash, value);
          } catch (err) {
            // value may be larger than total quota
            log.warn(`Could not add item with key ${'}${key}${'}, perhaps it is too big?`);
            this.remove(hash);
            return false;
          }
        } else {
          // If it was some other error, just give up.
          log.warn(`Could not add item with key ${'}${key}${'}.`);
          this.remove(hash);
          return false;
        }

        // If a time is specified, store expiration info in localStorage
        if (time) {
          this.setItem(this.expirationKey(hash), (this.currentTime + time).toString(this.expiryRadix));
        } else {
          // In case they previously set a time, remove that info from localStorage.
          this.removeItem(this.expirationKey(hash));
        }
      }
    }

    // Return success
    return success;
  }

  setItem(key, value) {
    // Fix for iPad issue - sometimes throws QUOTA_EXCEEDED_ERR on setItem.
    localStorage.removeItem(`${this.cachePrefix}${this.bucket}${key}`);
    return localStorage.setItem(`${this.cachePrefix}${this.bucket}${key}`, value);
  }

  destroy(key) {
    const hash = this.hashKey(key);
    super.del(hash);
    this.flushItem(hash);
  }

  removeItem(key) {
    return localStorage.removeItem(`${this.cachePrefix}${this.bucket}${key}`);
  }

  /**
   * Returns the full string for the localStorage expiration item.
   * @param {String} key
   * @return {string}
   */
  expirationKey(key) {
    return `${key}${this.cacheSuffix}`;
  }

  flush() {
    this.eachKey((key) => {
      this.flushItem(key);
    });
  }

  flushItem(key) {
    const exprKey = this.expirationKey(key);
    this.removeItem(key);
    this.removeItem(exprKey);
  }

  flushExpired() {
    this.eachKey((key) => {
      this.flushExpiredItem(key);
    });
  }

  flushExpiredItem(key) {
    const exprKey = this.expirationKey(key);
    const expr = this.getItem(exprKey);

    if (expr) {
      const expirationTime = parseInt(expr, this.expiryRadix);

      // Check if we should actually kick item out of storage
      if (this.currentTime >= expirationTime) {
        this.removeItem(key);
        this.removeItem(exprKey);
        return true;
      }
    }
  }
}

class Cache {
  constructor(name = '') {
    this[privateCacheSymbol] = new PrivateCache(name);
  }

  get(key) {
    return this[privateCacheSymbol].get(key);
  }

  set(key, value, time) {
    return this[privateCacheSymbol].set(key, value, time);
  }

  destroy(key) {
    return this[privateCacheSymbol].destroy(key);
  }

  flush() {
    return this[privateCacheSymbol].flush();
  }

  flushExpired() {
    return this[privateCacheSymbol].flushExpired();
  }

  static sharedInstance() {
    let cache = Cache[sharedInstanceSymbol];

    if (!isDefined(cache)) {
      const client = Kinvey.toJSON();
      cache = new Cache(`${client.appKey}`);
      Cache[sharedInstanceSymbol] = cache;
    }

    return cache;
  }
}

export default Cache;

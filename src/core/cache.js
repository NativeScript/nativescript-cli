import NodeCache from 'node-cache';
import {isDefined} from '../utils';
import sha1 from 'crypto-js/sha1';
import log from 'loglevel';
import Kinvey from '../kinvey';
import localStorage from 'humble-localstorage';

// Symbol to hold cache instance
const cacheSymbol = Symbol();

// Prefix for all lscache keys
const cachePrefix = 'Kinvey-';

// Suffix for the key name on the expiration items
const cacheSuffix = '-cacheexpiration';

// expiration date radix (set to Base-36 for most space savings)
const expiryRadix = 10;

// time resolution in minutes
const expiryUnits = 60 * 1000;

// ECMAScript max Date (epoch + 1e8 days)
const maxDate = Math.floor(8.64e15 / expiryUnits);

function generateKeyHash(key) {
  return sha1(key).toString();
}

// Check to set if the error is us dealing with being out of space
function isOutOfSpace(e) {
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
function escapeRegExpSpecialCharacters(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Returns the full string for the localStorage expiration item.
 * @param {String} key
 * @return {string}
 */
function expirationKey(key) {
  return key + cacheSuffix;
}

function eachKey(bucket, fn) {
  const prefixRegExp = new RegExp(`^${cachePrefix}${escapeRegExpSpecialCharacters(bucket)}(.*)`);

  // Loop in reverse as removing items will change indices of tail
  for (let i = localStorage.length - 1; i >= 0; --i) {
    let key = localStorage.key(i);
    key = key && key.match(prefixRegExp);
    key = key && key[1];
    if (isDefined(key) && key.indexOf(cacheSuffix) < 0) {
      fn(key, expirationKey(key));
    }
  }
}

/**
 * Returns the number of minutes since the epoch.
 * @return {number}
 */
function currentTime() {
  return Math.floor(new Date().getTime() / expiryUnits);
}

function getItem(bucket, key) {
  return localStorage.getItem(`${cachePrefix}${bucket}${key}`);
}

function setItem(bucket, key, value) {
  // Fix for iPad issue - sometimes throws QUOTA_EXCEEDED_ERR on setItem.
  localStorage.removeItem(`${cachePrefix}${bucket}${key}`);
  localStorage.setItem(`${cachePrefix}${bucket}${key}`, value);
}

function removeItem(bucket, key) {
  localStorage.removeItem(`${cachePrefix}${bucket}${key}`);
}

function flushItem(bucket, key) {
  const exprKey = expirationKey(key);
  removeItem(bucket, key);
  removeItem(bucket, exprKey);
}

function flushExpiredItem(bucket, key) {
  const exprKey = expirationKey(key);
  const expr = getItem(bucket, exprKey);

  if (expr) {
    const expirationTime = parseInt(expr, expiryRadix);

    // Check if we should actually kick item out of storage
    if (currentTime() >= expirationTime) {
      removeItem(bucket, key);
      removeItem(bucket, exprKey);
      return true;
    }
  }
}

class Cache extends NodeCache {
  constructor(bucket = '') {
    super();

    // Set the bucket
    this.bucket = bucket;
  }

  get(key) {
    const hash = generateKeyHash(key);
    let value = super.get(hash);

    // Try to retrieve the stored value
    if (!isDefined(value)) {
      // Get the value from local storage
      value = getItem(this.bucket, hash);

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

  static get(key) {
    const cache = Cache.instance();
    return cache.get(key);
  }

  set(key, value, time) {
    const hash = generateKeyHash(key);
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
        setItem(this.bucket, hash, value);
      } catch (err) {
        if (isOutOfSpace(err)) {
          // If we exceeded the quota, then we will sort
          // by the expire time, and then remove the N oldest
          const storedKeys = [];
          let storedKey;

          eachKey(this.bucket, function each(key, exprKey) {
            let expiration = getItem(this.bucket, exprKey);

            if (expiration) {
              expiration = parseInt(expiration, expiryRadix);
            } else {
              // TODO: Store date added for non-expiring items for smarter removal
              expiration = maxDate;
            }

            storedKeys.push({
              key: key,
              size: (getItem(this.bucket, key) || '').length,
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
            flushItem(this.bucket, storedKey.key);
            targetSize -= storedKey.size;
          }

          try {
            setItem(this.bucket, key, value);
          } catch (err) {
            // value may be larger than total quota
            log.warn(`Could not add item with key ${'}${key}${'}, perhaps it is too big?`);
            this.remove(key);
            return false;
          }
        } else {
          // If it was some other error, just give up.
          log.warn(`Could not add item with key ${'}${key}${'}.`);
          this.remove(key);
          return false;
        }

        // If a time is specified, store expiration info in localStorage
        if (time) {
          setItem(this.bucket, expirationKey(key), (currentTime() + time).toString(expiryRadix));
        } else {
          // In case they previously set a time, remove that info from localStorage.
          removeItem(expirationKey(key));
        }
      }
    }

    // Return success
    return success;
  }

  static set(key, value, time) {
    const cache = Cache.instance();
    return cache.set(key, value, time);
  }

  del(key) {
    const hash = generateKeyHash(key);
    super.del(hash);
    flushItem(this.bucket, hash);
  }

  static del(key) {
    const cache = Cache.instance();
    return cache.del(key);
  }

  flush() {
    eachKey(this.bucket, (key) => {
      flushItem(this.bucket, key);
    });
  }

  static flush() {
    const cache = Cache.instance();
    return cache.flush();
  }

  flushExpired() {
    eachKey(this.bucket, (key) => {
      flushExpiredItem(this.bucket, key);
    });
  }

  static flushExpired() {
    const cache = Cache.instance();
    return cache.flushExpired();
  }

  static instance() {
    let cache = Cache[cacheSymbol];

    if (!isDefined(cache)) {
      cache = new Cache(`${Kinvey.appKey}-`);
      Cache[cacheSymbol] = cache;
    }

    return cache;
  }
}

export default Cache;

import CoreObject from './object';
import lscache from 'lscache';
import Kinvey from '../kinvey';
import utils from './utils';
import sha1 from 'crypto-js/sha1';
const cacheSymbol = Symbol();

// Set the local storage implementation
global.localStorage = require('humble-localstorage');

// @if PLATFORM_ENV='node'
let window = global.window || {};
window.JSON = JSON;
global.window = window;
// @endif

function generateKeyHash(key) {
  return sha1(key).toString();
}

class Cache extends CoreObject {
  constructor(name = `Kinvey.${Kinvey.appKey}`, time = null) {
    super();

    // Set the name
    this.name = name;
    this.defaultTime = time;

    // Flush expired items
    this.flushExpired();
  }

  static get(key) {
    let cache = Cache.instance();
    return cache.get(key);
  }

  get(key) {
    // Generate a key hash
    let keyHash = generateKeyHash(key);

    // Set the bucket for the cache
    lscache.setBucket(this.name);

    // Get the response from the cache
    return lscache.get(keyHash);
  }

  static set(key, value, time) {
    let cache = Cache.instance();
    return cache.set(key, value, time);
  }

  set(key, value, time = this.defaultTime) {
    // Generate a key hash
    let keyHash = generateKeyHash(key);

    // Set the bucket for the cache
    lscache.setBucket(this.name);

    // Store the response in the cache
    return lscache.set(keyHash, value, time);
  }

  static remove(key) {
    let cache = Cache.instance();
    return cache.remove(key);
  }

  remove(key) {
    // Generate a key hash
    let keyHash = generateKeyHash(key);

    // Set the bucket for the cache
    lscache.setBucket(this.name);

    // Remove the response from the cache
    return lscache.remove(keyHash);
  }

  static flush() {
    let cache = Cache.instance();
    return cache.flush();
  }

  flush() {
    // Set the bucket for the cache
    lscache.setBucket(this.name);

    // Flush the cache
    lscache.flush();
  }

  static flushExpired() {
    let cache = Cache.instance();
    return cache.flushExpired;
  }

  flushExpired() {
    // Set the bucket for the cache
    lscache.setBucket(this.name);

    // Flush the expired items
    lscache.flushExpired();
  }

  static instance() {
    let cache = this[cacheSymbol];

    if (!utils.isDefined(cache)) {
      cache = new Cache();
      this[cacheSymbol] = cache;
    }

    return cache;
  }
}

export default Cache;

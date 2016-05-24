'use strict';

/**
 * Provides in-memory cache.
 *
 * @name MemoryCache
 * @constructor
 */
function MemoryCache() {
    this._cache = createMap();
    this._timeouts = createMap();
}

/**
 * Returns cache value for the specified key.
 *
 * @param {String} key
 * @returns {*} Value or `undefined` if value does not exist.
 */
MemoryCache.prototype.get = function (key) {
    return this._cache[key];
};

/**
 * Assigns value for the specified key.
 *
 * @param {String} key
 * @param {*} value
 * @param {Number} [expireTime=0] The length of time in seconds. After this time has expired, the
 *      value will be automatically deleted. 0 means that time never expire.
 */
MemoryCache.prototype.set = function (key, value, expireTime) {
    this.delete(key);
    this._cache[key] = value;
    if (expireTime) {
        this._timeouts[key] = setTimeout(this.delete.bind(this, key), expireTime * 1000);
    }
};

/**
 * Deletes value for the specified key.
 *
 * @param {String} key
 */
MemoryCache.prototype.delete = function (key) {
    delete this._cache[key];
    if (key in this._timeouts) {
        clearTimeout(this._timeouts[key]);
        delete this._timeouts[key];
    }
};

/**
 * Clears the whole cache storage.
 */
MemoryCache.prototype.clear = function () {
    this._cache = createMap();
    for (var key in this._timeouts) {
        clearTimeout(this._timeouts[key]);
    }
    this._timeouts = createMap();
};

/**
 * Creates a new object without a prototype. This object is useful for lookup without having to
 * guard against prototypically inherited properties via hasOwnProperty.
 *
 * @returns {Object}
 */
function createMap() {
    return Object.create(null);
}

module.exports = MemoryCache;

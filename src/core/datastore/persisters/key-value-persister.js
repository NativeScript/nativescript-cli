const _cache = {};

export class KeyValuePersister {
  /** @type {Boolean} */
  _cacheEnabled;
  /** @type {Number} */
  _ttl;

  // TODO: implement TTL, make _cache a constructor argument?
  constructor(cacheEnabled = true, ttl = Infinity) {
    this._cacheEnabled = cacheEnabled;
    this._ttl = ttl;
  }

  readEntities(key) {
    if (this._cacheEnabled && _cache[key]) {
      return Promise.resolve(_cache[key]);
    }

    return this._readFromPersistance(key)
      .then((entities) => {
        entities = entities || [];
        if (this._cacheEnabled) {
          _cache[key] = entities;
        }
        return entities;
      });
  }

  persistEntities(key, entities) {
    if (this._cacheEnabled) {
      delete _cache[key];
    }
    return this._writeToPersistance(key, entities)
      .then((result) => {
        if (this._cacheEnabled && this._ttl < Infinity) {
          setTimeout(() => {
            delete _cache[key];
          }, this._ttl);
        }
        return result;
      });
  }

  deleteEntities(key) {
    if (this._cacheEnabled) {
      delete _cache[key];
    }
    return this._deletePersistance(key);
  }

  _throwNotImplementedError() {
    throw new Error('Abstract method not implemented');
  }

  _readFromPersistance(key) {
    this._throwNotImplementedError(key);
  }

  _writeToPersistance(key, array) {
    this._throwNotImplementedError(key, array);
  }

  _deletePersistance(key) {
    this._throwNotImplementedError(key);
  }
}

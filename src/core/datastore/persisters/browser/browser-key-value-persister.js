import { Client } from '../../../client';

import { KeyValuePersister } from '../key-value-persister';
import { browserStorageCollectionsMaster } from '../../utils';

/**
 * @typedef BrowserStore
 * @property {Function} getItem
 * @property {Function} setItem
 * @property {Function} removeItem
 * @property {Function} clear
 */

export class BrowserKeyValuePersister extends KeyValuePersister {
  /** @type {BrowserStore} */
  _store;

  constructor(store, cacheEnabled, cacheTtl) {
    super(cacheEnabled, cacheTtl);
    this._store = store;
  }

  getKeys() {
    return Promise.resolve(Object.keys(this._store));
  }

  _readFromPersistance(collection) {
    const serialized = this._store.getItem(collection);
    return this._deserialize(serialized);
  }

  _writeToPersistance(collection, entities) {
    return this._ensureCollectionExists(collection)
      .then(() => this._deserializeAndSet(collection, entities));
  }

  _deleteFromPersistance(collection) {
    this._store.removeItem(collection);
    return Promise.resolve();
  }

  // private methods

  _buildMasterCollectionName() {
    return `${Client.sharedInstance().appKey}.${browserStorageCollectionsMaster}`;
  }

  _ensureCollectionExists(collection) {
    const masterCollectionName = this._buildMasterCollectionName();
    return this._readFromPersistance(masterCollectionName)
      .then((allCollections) => {
        allCollections = allCollections || [];
        const exists = allCollections.find(c => c === collection);
        if (exists) {
          return Promise.resolve();
        }
        allCollections.push(collection);
        return this._deserializeAndSet(masterCollectionName, allCollections);
      });
  }

  _deserializeAndSet(collection, entities) {
    return this._serialize(entities)
      .then(serialized => this._store.setItem(collection, serialized));
  }

  _serialize(obj) {
    try {
      return Promise.resolve(JSON.stringify(obj));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  _deserialize(serializedObj) {
    try {
      const deserialized = JSON.parse(serializedObj);
      return Promise.resolve(deserialized);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

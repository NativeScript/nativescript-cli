import isString from 'lodash/isString';

import { KinveyError } from '../errors';
import { isDefined } from '../utils';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';
import { SyncStore } from './syncstore';
import { processorFactory } from './processors';
import { repositoryProvider } from './repositories';

/**
 * @typedef   {Object}    DataStoreType
 * @property  {string}    Cache           Cache datastore type
 * @property  {string}    Network         Network datastore type
 * @property  {string}    Sync            Sync datastore type
 */
export const DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};
Object.freeze(DataStoreType);

/**
 * The DataStore class is used to find, create, update, remove, count and group entities.
 */
export class DataStore {
  constructor() {
    throw new KinveyError('Not allowed to construct a DataStore instance.'
      + ' Please use the collection() function to get an instance of a DataStore instance.');
  }

  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}           [collection]                  Name of the collection.
   * @param  {DataStoreType}    [type=DataStoreType.Cache]    Type of store to return.
   * @return {DataStore}                                      DataStore instance.
   */
  static collection(collection, type = DataStoreType.Cache, options) {
    let store;

    if (isDefined(collection) === false || isString(collection) === false) {
      throw new KinveyError('A collection is required and must be a string.');
    }

    switch (type) {
      case DataStoreType.Network: {
        const processor = processorFactory.getNetworkProcessor();
        store = new NetworkStore(collection, processor, options);
        break;
      }
      case DataStoreType.Sync: {
        const processor = processorFactory.getOfflineProcessor();
        store = new SyncStore(collection, processor, options);
        break;
      }
      case DataStoreType.Cache:
      default: {
        const processor = processorFactory.getCacheOfflineDataProcessor();
        store = new CacheStore(collection, processor, options);
      }
    }

    return store;
  }

  /**
   * @private
   */
  static getInstance(collection, type, options) {
    return this.collection(collection, type, options);
  }

  /**
   * Clear the cache. This will delete all data in the cache.
   *
   * @param  {Object} [options={}] Options
   * @return {Promise<Object>} The result of clearing the cache.
   */
  static clearCache(options = {}) {
    return repositoryProvider.getOfflineRepository()
      .then(repo => repo.clear())
      .then(() => null); // backwards compatibility
  }
}

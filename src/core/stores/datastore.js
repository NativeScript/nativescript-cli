import NetworkStore from './networkStore';
import CacheStore from './cacheStore';
import SyncStore from './syncStore';
import { DataStoreType } from '../enums';

export default class DataStore {
  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       name                        Name of the collection.
   * @param  {StoreType}    [type=DataStoreType.Cache]  Type of store to return.
   * @return {Object}                                   Store
   */
  static getInstance(name, type = DataStoreType.Cache) {
    let store;

    switch (type) {
      case DataStoreType.Sync:
        store = new SyncStore(name);
        break;
      case DataStoreType.Network:
        store = new NetworkStore(name);
        break;
      case DataStoreType.Cache:
      default:
        store = new CacheStore(name);
    }

    return store;
  }
}

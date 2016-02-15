import NetworkStore from './networkStore';
import CacheStore from './cacheStore';
import SyncStore from './syncStore';
import { DataStoreType } from '../enums';
const dataStoresMap = new Map();

export default class DataStore {
  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       name                      Name of the collection.
   * @param  {StoreType}    [type=StoreType.Cache]    Type of store to return.
   * @return {Store}                                  Store
   */
  static getInstance(name, type = DataStoreType.Cache) {
    let store = dataStoresMap.get(`${name}_${type}`);

    if (!store) {
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

      dataStoresMap.set(`${name}_${type}`, store);
    }

    return store;
  }
}

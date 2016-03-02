import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';
import { SyncStore } from './syncstore';
import { UserStore } from './userstore';
import { FileStore } from './filestore';

/**
 * Enum for DataStore types.
 */
const DataStoreType = {
  Sync: 'Sync',
  Cache: 'Cache',
  Network: 'Network',
  User: 'User',
  File: 'File'
};
Object.freeze(DataStoreType);
export { DataStoreType };


export class DataStore {
  /**
   * Returns an instance of the Store class based on the type provided.
   *
   * @param  {string}       [name]                      Name of the collection.
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
      case DataStoreType.User:
        store = new UserStore();
        break;
      case DataStoreType.File:
        store = new FileStore();
        break;
      case DataStoreType.Cache:
      default:
        store = new CacheStore(name);
    }

    return store;
  }
}

export {
  CacheStore,
  FileStore,
  NetworkStore,
  SyncStore,
  UserStore
};

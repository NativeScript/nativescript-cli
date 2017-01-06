import CacheStore from './src/cachestore';
import DataStore, { DataStoreType } from './src/datastore';
import FileStore from './src/filestore';
import NetworkStore from './src/networkstore';
import SyncStore from './src/syncstore';
import UserStore from './src/userstore';

// Export
export {
  CacheStore,
  DataStoreType,
  FileStore,
  NetworkStore,
  SyncStore,
  UserStore
};

// Export default
export default DataStore;

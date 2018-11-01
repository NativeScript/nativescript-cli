import { getConfig } from 'kinvey-app';
import { clearAll } from 'kinvey-cache';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';

export const DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};

export function collection(collectionName, type = DataStoreType.Cache, options = {}) {
  let datastore;

  if (collectionName == null || typeof collectionName !== 'string') {
    throw new Error('A collection name is required and must be a string.');
  }

  if (type === DataStoreType.Network) {
    datastore = new NetworkStore(collectionName);
  } else if (type === DataStoreType.Cache) {
    datastore = new CacheStore(collectionName, Object.assign({}, options, { autoSync: true }));
  } else if (type === DataStoreType.Sync) {
    datastore = new CacheStore(collectionName, Object.assign({}, options, { autoSync: false }));
  } else {
    throw new Error('Unknown data store type.');
  }

  return datastore;
}

export async function clearCache() {
  const { appKey } = getConfig();
  await clearAll(appKey);
  return null;
}

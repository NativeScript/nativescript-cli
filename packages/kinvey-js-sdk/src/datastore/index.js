import { getConfig } from '../client';
import { clearAll } from '../cache';
import NetworkStore from './networkstore';
import CacheStore from './cachestore';

export const DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  Sync: 'Sync'
};

export function collection(collectionName, type = DataStoreType.Cache, options = {}) {
  if (collectionName == null || typeof collectionName !== 'string') {
    throw new Error('A collection name is required and must be a string.');
  }

  const { appKey } = getConfig();
  let datastore;

  if (type === DataStoreType.Network) {
    datastore = new NetworkStore(appKey, collectionName);
  } else if (type === DataStoreType.Cache) {
    datastore = new CacheStore(appKey, collectionName, options.tag, Object.assign({}, options, { autoSync: true }));
  } else if (type === DataStoreType.Sync) {
    datastore = new CacheStore(appKey, collectionName, options.tag, Object.assign({}, options, { autoSync: false }));
  } else {
    throw new Error('Unknown data store type.');
  }

  return datastore;
}

export async function clearCache() {
  const { appKey } = getConfig();
  await clearAll(appKey);
}

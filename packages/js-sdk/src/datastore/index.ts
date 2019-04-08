import isString from 'lodash/isString';
import { KinveyError } from '../errors/kinvey';
import { isValidTag } from './cache';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';

export enum DataStoreType {
  Cache = 'Cache',
  Network = 'Network',
  Sync = 'Sync'
};

export function collection(collectionName: string, type = DataStoreType.Cache, options: any = {}) {
  let datastore;
  const tagWasPassed = options && ('tag' in options);

  if (collectionName == null || !isString(collectionName)) {
    throw new KinveyError('A collection is required and must be a string.');
  }
  if (tagWasPassed && !isValidTag(options.tag)) {
    throw new KinveyError('Please provide a valid data store tag.');
  }

  if (type === DataStoreType.Network) {
    if (tagWasPassed) {
      throw new KinveyError('The tagged option is not valid for data stores of type "Network"');
    }

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

export function getInstance(collectionName: string, type?: DataStoreType, options?: any) {
  return collection(collectionName, type, options);
}

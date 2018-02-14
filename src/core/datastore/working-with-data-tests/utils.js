import expect from 'expect';

import { Operation } from '../operations';
import { DataStoreType } from '../datastore';
import { NetworkStore } from '../networkstore';
import { CacheStore } from '../cachestore';
import { SyncStore } from '../syncstore';

import { mockRequiresIn } from '../require-helper';

const typeToFilePathMap = {
  [DataStoreType.Sync]: '../syncstore',
  [DataStoreType.Cache]: '../cachestore',
  [DataStoreType.Network]: '../networkstore'
};

const buildDataStoreInstance = (storeType, collection, dataProcessor, options) => {
  switch (storeType) {
    case DataStoreType.Sync:
      return new SyncStore(collection, dataProcessor, options);
    case DataStoreType.Cache:
      return new CacheStore(collection, dataProcessor, options);
    case DataStoreType.Network:
      return new NetworkStore(collection, dataProcessor, options);
    default:
      throw new Error('Unexpected store type');
  }
};

const storeBuilder = (storeType, collection, dataProcessor, requireMocks, options) => {
  if (!requireMocks) {
    return buildDataStoreInstance(storeType, collection, dataProcessor, options);
  }

  const DataStoreClass = mockRequiresIn(__dirname, typeToFilePathMap[storeType], requireMocks, `${storeType}Store`);
  return new DataStoreClass(collection, dataProcessor, options);
};

export const datastoreFactory = {
  [DataStoreType.Sync]: storeBuilder.bind(this, DataStoreType.Sync),
  [DataStoreType.Cache]: storeBuilder.bind(this, DataStoreType.Cache),
  [DataStoreType.Network]: storeBuilder.bind(this, DataStoreType.Network)
};

/** @param {Operation} op */
export function validateOperationObj(op, type, collection, query, data, entityId) {
  expect(op).toBeA(Operation);
  expect(op.type).toEqual(type);
  expect(op.collection).toEqual(collection);
  expect(op.query).toBe(query);
  expect(op.data).toBe(data);
  expect(op.entityId).toBe(entityId);
}

export function createPromiseSpy(value, reject = false) {
  const shouldReject = reject === true;
  const promise = shouldReject ? Promise.reject(value) : Promise.resolve(value);
  return expect.createSpy().andReturn(promise);
}

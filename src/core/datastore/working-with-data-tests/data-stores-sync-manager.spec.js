import expect from 'expect';

import { DataStoreType } from '../datastore';
import { Query } from '../../query';
import { datastoreFactory, createPromiseSpy } from './utils';

const collection = 'books';
const optionKeyName = 'test';
const dataStoreTypes = [DataStoreType.Sync, DataStoreType.Cache];

const validateSyncManagerCall = (spy, query, options) => {
  expect(spy.calls.length).toBe(1);
  let expectedArgumentsCount = 1;
  if (query) {
    expectedArgumentsCount += 1;
  }
  if (options) {
    expectedArgumentsCount += 1;
    expect(spy.calls[0].arguments[2]).toIncludeKey(optionKeyName);
  }
  expect(spy.calls[0].arguments.length).toBe(expectedArgumentsCount);
  expect(spy.calls[0].arguments[0]).toBe(collection);
  expect(spy.calls[0].arguments[1]).toBe(query);
};

describe('Data stores delegate correctly to sync manager', () => {
  let syncManagerMock;

  beforeEach(() => {
    syncManagerMock = {
      getSyncItemCountByEntityQuery: createPromiseSpy(),
      getSyncItemCount: createPromiseSpy(),
      getSyncEntities: createPromiseSpy(),
      push: createPromiseSpy(),
      pull: createPromiseSpy(),
      clearSync: createPromiseSpy()
    };
  });

  dataStoreTypes.forEach((storeType) => {
    describe(`${storeType}Store`, () => {
      /** @type {CacheStore} */ // for definitions only
      let store;

      beforeEach(() => {
        expect.restoreSpies();
        const buildStore = datastoreFactory[storeType];
        store = buildStore(collection);
        // avoid proxyquire, since it can't reliably stub syncManagerProvider
        // in CacheStore when requiring SyncManager
        store.syncManager = syncManagerMock;
      });

      it('pendingSyncCount() with query', () => {
        const query = new Query();
        return store.pendingSyncCount(query)
          .then(() => {
            const spy = syncManagerMock.getSyncItemCountByEntityQuery;
            validateSyncManagerCall(spy, query);
          });
      });

      it('pendingSyncCount() with NO query', () => {
        return store.pendingSyncCount()
          .then(() => {
            const spy = syncManagerMock.getSyncItemCount;
            validateSyncManagerCall(spy);
          });
      });

      it('pendingSyncEntities', () => {
        const query = new Query();
        return store.pendingSyncEntities(query)
          .then(() => {
            const spy = syncManagerMock.getSyncEntities;
            validateSyncManagerCall(spy, query);
          });
      });

      it('push', () => {
        const query = new Query();
        const options = { [optionKeyName]: true };
        return store.push(query, options)
          .then(() => {
            const spy = syncManagerMock.push;
            validateSyncManagerCall(spy, query, options);
          });
      });

      it('pull when there are pending sync items', () => {
        const query = new Query();
        const options = { [optionKeyName]: true };
        syncManagerMock.getSyncItemCountByEntityQuery = createPromiseSpy(123);
        return store.pull(query, options)
          .then(() => {
            const pushSpy = syncManagerMock.push;
            validateSyncManagerCall(pushSpy, query);

            const pullSpy = syncManagerMock.pull;
            validateSyncManagerCall(pullSpy, query, options);
            expect(pullSpy.calls[0].arguments[2].useDeltaFetch).toBe(store.useDeltaFetch);
          });
      });

      it('pull when there are NO pending sync items', () => {
        const query = new Query();
        const options = { [optionKeyName]: true };
        return store.pull(query, options)
          .then(() => {
            const spy = syncManagerMock.pull;
            validateSyncManagerCall(spy, query, options);
            expect(spy.calls[0].arguments[2].useDeltaFetch).toBe(store.useDeltaFetch);
          });
      });

      it('sync when push succeeds', () => {
        const query = new Query();
        const options = { [optionKeyName]: 123 };
        const pushSpy = syncManagerMock.push;
        const pullSpy = syncManagerMock.pull;
        return store.sync(query, options)
          .then(() => {
            validateSyncManagerCall(pushSpy, query, options);
            validateSyncManagerCall(pullSpy, query, options);
            expect(pushSpy.calls[0].arguments[2].useDeltaFetch).toBe(store.useDeltaFetch);
            expect(pullSpy.calls[0].arguments[2].useDeltaFetch).toBe(store.useDeltaFetch);
          });
      });

      it('sync when push fails', () => {
        const query = new Query();
        const options = { [optionKeyName]: 123 };
        syncManagerMock.push = createPromiseSpy(new Error('some error'), true);
        const pushSpy = syncManagerMock.push;
        const pullSpy = syncManagerMock.pull;
        return store.sync(query, options)
          .then(() => {
            return Promise.reject(new Error('should not happen'));
          })
          .catch(() => {
            validateSyncManagerCall(pushSpy, query, options);
            expect(pushSpy.calls[0].arguments[2].useDeltaFetch).toBe(store.useDeltaFetch);
            expect(pullSpy.calls.length).toBe(0);
          });
      });

      it('clearSync', () => {
        const query = new Query();
        return store.clearSync(query)
          .then(() => {
            const spy = syncManagerMock.clearSync;
            validateSyncManagerCall(spy, query);
          });
      });
    });
  });
});

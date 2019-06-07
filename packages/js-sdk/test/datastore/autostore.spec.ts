/// <reference types="mocha" />

import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyHttpHeaders } from '../../src/http';
import { init } from '../../src/init';
import { collection, DataStoreType } from '../../src/datastore';
import { setSession, removeSession } from '../../src/http/session';
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';
const COLLECTION_NAME = 'testCollection'

describe('Autostore', function() {
  before(function() {
    return init({
      kinveyConfig: {
        appKey: APP_KEY,
        appSecret: APP_SECRET
      },
      httpAdapter,
      sessionStore: sessionStore,
      popup: null,
      storageAdapter: memoryStorageAdapter,
      pubnub: null
    })
  });

  before(function() {
    return setSession({
      _id: '1',
      _kmd: {
        authtoken: 'authtoken'
      }
    });
  });

  after(function() {
    return removeSession();
  });

  afterEach(function() {
    const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
    return syncStore.clear();
  });

  describe('with invalid data and network interruptions', function () {
    it('should return locally stored data if connectivity error', async function() {
      // Save some local items with sync store
      const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
      const docs = await Promise.all([
        syncStore.save({}),
        syncStore.save({})
      ]);
      await syncStore.clearSync();

      // Find with auto store
      const autoStore = collection(COLLECTION_NAME, DataStoreType.Auto);
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, autoStore.pathname));
      const scope = nock(url.origin)
        .get(url.pathname)
        .replyWithError({ code: 'ECONNREFUSED' });

      // Verify
      expect(await autoStore.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);
    });

    it('should return locally stored data if connectivity error with tagged store', async function() {
      const tag = 'foo';

      // Save some local items with sync store
      const taggedSyncStore = collection(COLLECTION_NAME, DataStoreType.Sync, { tag });
      const docs = await Promise.all([
        taggedSyncStore.save({}),
        taggedSyncStore.save({})
      ]);
      await taggedSyncStore.clearSync();

      // Find with auto store
      const autoStore = collection(COLLECTION_NAME, DataStoreType.Auto);
      const taggedAutoStore = collection(COLLECTION_NAME, DataStoreType.Auto, { tag });
      const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, taggedAutoStore.pathname));
      const scope = nock(url.origin)
        .get(url.pathname)
        .replyWithError({ code: 'ECONNREFUSED' });

      // Verify
      expect(await autoStore.find()).to.deep.equal([]);
      expect(await taggedAutoStore.find()).to.deep.equal(docs);
      expect(scope.isDone()).to.equal(true);
    });
  });
});

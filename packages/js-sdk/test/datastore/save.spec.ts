/// <reference types="mocha" />

import { expect } from 'chai';
import nock from 'nock';
import { URL } from 'url';
import { formatKinveyBaasUrl, KinveyBaasNamespace, KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, KinveyHttpHeaders } from '../../src/http';
import { init } from '../../src/init';
import { collection, DataStoreType } from '../../src/datastore';
import { setSession, removeSession } from '../../src/http/session';
import { KinveyError } from '../../src/errors';
import * as httpAdapter from '../http';
import * as memoryStorageAdapter from '../memory';
import * as sessionStore from '../sessionStore';

const APP_KEY = 'appKey';
const APP_SECRET = 'appSecret';
const COLLECTION_NAME = 'testCollection'
const BATCH_SIZE = 100;

describe('save()', function () {
  before(function () {
    return setSession({
      _id: '1',
      _kmd: {
        authtoken: 'authtoken'
      }
    });
  });

  after(function () {
    return removeSession();
  });

  afterEach(function() {
    return nock.cleanAll();
  });

  afterEach(function () {
    const syncStore = collection(COLLECTION_NAME, DataStoreType.Sync);
    return syncStore.clear();
  });

  describe('with API Version 4', function () {
    before(function () {
      return init({
        kinveyConfig: {
          appKey: APP_KEY,
          appSecret: APP_SECRET,
          apiVersion: 4
        },
        httpAdapter,
        sessionStore: sessionStore,
        popup: null,
        storageAdapter: memoryStorageAdapter,
        pubnub: null
      })
    });

    describe('with an array of docs', function() {
      it('should throw an error', async function () {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Network);

        try {
          await store.save(docs);
        } catch (error) {
          expect(error).to.be.instanceOf(KinveyError);
          expect(error.message).to.equal('Unable to create an array of entities. Please create entities one by one.');
        }
      });
    });

    describe('with a single doc', function() {
      it('should send a POST request', async function() {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });
  });

  describe('with API Version 5', function() {
    before(function () {
      return init({
        kinveyConfig: {
          appKey: APP_KEY,
          appSecret: APP_SECRET,
          apiVersion: 5
        },
        httpAdapter,
        sessionStore: sessionStore,
        popup: null,
        storageAdapter: memoryStorageAdapter,
        pubnub: null
      })
    });

    describe('with an array of docs', function () {
      it('should send a multi insert request', async function () {
        const docs = [{}, {}];
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(207, docs);
        expect(await store.save(docs)).to.deep.equal(docs);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send 2 multi insert requests if the length of the array is 150', async function () {
        const docs = [];

        for(let i = 0; i < 150; i++) {
          docs.push({});
        }

        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope1 = nock(url.origin)
          .post(url.pathname)
          .reply(207, docs.slice(0, BATCH_SIZE));
        const scope2 = nock(url.origin)
          .post(url.pathname)
          .reply(207, docs.slice(BATCH_SIZE, docs.length));
        expect(await store.save(docs)).to.deep.equal(docs);
        expect(scope1.isDone()).to.equal(true);
        expect(scope2.isDone()).to.equal(true);
      });
    });

    describe('with a single doc', function () {
      it('should send a POST request', async function () {
        const doc = {};
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, store.pathname));
        const scope = nock(url.origin)
          .post(url.pathname)
          .reply(201, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });

      it('should send a PUT request', async function () {
        const doc = { _id: '1' };
        const store = collection(COLLECTION_NAME, DataStoreType.Network);
        const url = new URL(formatKinveyBaasUrl(KinveyBaasNamespace.AppData, `${store.pathname}/${doc._id}`));
        const scope = nock(url.origin)
          .put(url.pathname)
          .reply(200, doc);
        expect(await store.save(doc)).to.deep.equal(doc);
        expect(scope.isDone()).to.equal(true);
      });
    });
  });
});

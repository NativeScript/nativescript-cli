/* eslint-disable no-underscore-dangle */
import './setup';
import { DataStore, DataStoreType } from '../src/datastore';
import { KinveyError } from '../src/errors';
import { randomString } from '../src/utils/string';
import { loginUser, logoutUser } from './utils/user';
import nock from 'nock';
import chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
const collection = 'tests';

describe('DataStore', function() {
  beforeEach(function() {
    return loginUser.call(this);
  });

  afterEach(function() {
    const store = new DataStore(collection);

    nock(this.client.baseUrl)
      .get(`${store.pathname}/_count`)
      .query(true)
      .reply(200, { count: 0 }, {
        'content-type': 'application/json'
      });

    return store.clear().then(() => {
      const promise = new Promise((resolve, reject) => {
        const stream = store.count();
        stream.subscribe(count => {
          expect(count).to.equal(0);
        }, reject, resolve);
      });
      return promise;
    });
  });

  afterEach(function() {
    return logoutUser.call(this);
  });

  describe('constructor', function() {
    it('should not require a name to be provided', function() {
      const store = new DataStore();
      expect(store.name).to.be.undefined;
    });

    it('should throw an error if name is not a string', function() {
      expect(function() {
        const store = new DataStore({}); // eslint-disable-line no-unused-vars
      }).to.throw(/Collection must be a string./);
    });

    it('should accept a string for a name', function() {
      const store = new DataStore(collection);
      expect(store.collection).to.equal(collection);
    });

    it('should set ttl to undefined as the default', function() {
      const store = new DataStore();
      expect(store.ttl).to.be.undefined;
    });

    it('should set useDeltaFetch to false as the default', function() {
      const store = new DataStore();
      expect(store.useDeltaFetch).to.be.false;
    });

    it('should have the cache enabled as the default', function() {
      const store = new DataStore();
      expect(store.isCacheEnabled()).to.be.true;
    });

    it('should have the store online as the default', function() {
      const store = new DataStore();
      expect(store.isOnline()).to.be.true;
    });
  });

  describe('pathname', function() {
    it('should return /appdata/<appKey>', function() {
      const store = new DataStore();
      expect(store.pathname).to.equal(`/appdata/${this.client.appKey}`);
    });

    it('should return /appdata/<appKey>/<collection>', function() {
      const store = new DataStore(collection);
      expect(store.pathname).to.equal(`/appdata/${this.client.appKey}/${collection}`);
    });
  });

  describe('disableCache()', function() {
    it('should disable the cache', function() {
      const store = new DataStore();
      store.disableCache();
      expect(store.isCacheEnabled()).to.be.false;
    });

    it('should not allow the cache to be disabled if the store is offline', function() {
      const store = new DataStore();
      store.offline();
      expect(function() {
        store.disableCache();
      }).to.throw(/Unable to disable the cache when the store is offline./);
    });
  });

  describe('enableCache()', function() {
    it('should enable the cache', function() {
      const store = new DataStore();
      store.enableCache();
      expect(store.isCacheEnabled()).to.be.true;
    });
  });

  describe('isCacheEnabled()', function() {
    it('should return false if the cache is disabled', function() {
      const store = new DataStore();
      store.disableCache();
      expect(store.isCacheEnabled()).to.be.false;
    });

    it('should return true if the cache is enabled', function() {
      const store = new DataStore();
      store.enableCache();
      expect(store.isCacheEnabled()).to.be.true;
    });
  });

  describe('offline()', function() {
    it('should make the store go offline', function() {
      const store = new DataStore();
      store.offline();
      expect(store.isOnline()).to.be.false;
    });

    it('should not the store to go offline if the cache is disabled', function() {
      const store = new DataStore();
      store.disableCache();
      expect(function() {
        store.offline();
      }).to.throw(/Unable to go offline when the cache for the store is disabled./);
    });
  });

  describe('online()', function() {
    it('should make the store go online', function() {
      const store = new DataStore();
      store.online();
      expect(store.isOnline()).to.be.true;
    });
  });

  describe('isOnline()', function() {
    it('should return a false if the store is offline', function() {
      const store = new DataStore();
      store.offline();
      expect(store.isOnline()).to.be.false;
    });

    it('should return a true if the store is online', function() {
      const store = new DataStore();
      store.online();
      expect(store.isOnline()).to.be.true;
    });
  });

  describe('find()', function() {
    beforeEach(function() {
      const entity = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };
      const store = new DataStore(collection);

      nock(this.client.baseUrl)
        .post(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      return store.create(entity).then(entity => {
        this.entity = entity;
      });
    });

    it('should throw an error if a query is provided that is not an instance of the Query class', function(done) {
      const store = new DataStore(collection);
      store.find({}).subscribe(null, error => {
        expect(error).to.be.instanceof(KinveyError);
        expect(error.message).to.equal('Invalid query. It must be an instance of the Query class.');
        done();
      }, done);
    });

    it('should find all the data in a collection', function(done) {
      const store = new DataStore(collection);
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // Delta GET response
      nock(this.client.baseUrl)
        .get(store.pathname)
        .query(true)
        .reply(200, [
          {
            _id: this.entity._id,
            _kmd: this.entity._kmd
          },
          {
            _id: entity2._id,
            _kmd: entity2._kmd
          }
        ], {
          'content-type': 'application/json'
        });

      // GET response
      nock(this.client.baseUrl)
        .get(store.pathname)
        .query(true)
        .reply(200, [entity2], {
          'content-type': 'application/json'
        });

      const spy = this.sandbox.spy();
      store.find().subscribe(spy, done, () => {
        expect(spy).to.have.been.called.twice;
        done();
      });
    });
  });

  describe('create()', function() {
    describe('cacheEnabled/online', function() {
      it('should create a single entity', function() {
        const entity = {
          prop: randomString()
        };
        const store = new DataStore(collection);

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity, {
            'content-type': 'application/json'
          });

        return store.create(entity).then(data => {
          expect(data).to.have.property('_id');
          expect(data.prop).to.be.equal(entity.prop);
        });
      });

      it('should create an array of entities', function() {
        const entity1 = {
          prop: randomString()
        };
        const entity2 = {
          prop: randomString()
        };
        const store = new DataStore(collection);

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity1, {
            'content-type': 'application/json'
          });

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity2, {
            'content-type': 'application/json'
          });

        return store.create([entity1, entity2]).then(data => {
          expect(data).to.be.an('Array');
          expect(data.length).to.equal(2);
          expect(data[0].prop).to.equal(entity1.prop);
          expect(data[1].prop).to.equal(entity2.prop);
        });
      });
    });

    describe('cacheEnabled/offline', function() {
      it('should create a single entity', function() {
        const entity = {
          prop: randomString()
        };
        const store = new DataStore(collection);

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity, {
            'content-type': 'application/json'
          });

        return store.create(entity).then(data => {
          expect(data).to.have.property('_id');
          expect(data.prop).to.be.equal(entity.prop);
        });
      });

      it('should create an array of entities', function() {
        const entity1 = {
          prop: randomString()
        };
        const entity2 = {
          prop: randomString()
        };
        const store = new DataStore(collection);
        store.offline();

        return store.create([entity1, entity2]).then(data => {
          expect(data).to.be.an('Array');
          expect(data.length).to.equal(2);
          expect(data[0].prop).to.equal(entity1.prop);
          expect(data[1].prop).to.equal(entity2.prop);
          return store.syncCount();
        }).then(count => {
          expect(count).to.equal(2);
        });
      });
    });

    describe('cacheDisabled/online', function() {
      it('should create a single entity', function() {
        const entity = {
          prop: randomString()
        };
        const store = new DataStore(collection);
        store.disableCache();

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity, {
            'content-type': 'application/json'
          });

        return store.create(entity).then(data => {
          expect(data.prop).to.be.equal(entity.prop);
        });
      });

      it('should create an array of entities', function() {
        const entity1 = {
          prop: randomString()
        };
        const entity2 = {
          prop: randomString()
        };
        const store = new DataStore(collection);
        store.disableCache();

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity1, {
            'content-type': 'application/json'
          });

        nock(this.client.baseUrl)
          .post(store.pathname)
          .query(true)
          .reply(200, entity2, {
            'content-type': 'application/json'
          });

        return store.create([entity1, entity2]).then(data => {
          expect(data).to.be.an('Array');
          expect(data.length).to.equal(2);
          expect(data[0].prop).to.equal(entity1.prop);
          expect(data[1].prop).to.equal(entity2.prop);
        });
      });
    });
  });

  describe('collection()', function() {
    it('should be a static function', function() {
      expect(DataStore).itself.to.respondTo('collection');
    });

    it('should return a DataStore that is online and has cache enabled by default', function() {
      const store = DataStore.collection();
      expect(store.isOnline()).to.be.true;
      expect(store.isCacheEnabled()).to.be.true;
    });

    it('should return a DataStore that is offline and has cache enabled for DataStoreType.Sync', function() {
      const store = DataStore.collection(null, DataStoreType.Sync);
      expect(store.isOnline()).to.be.false;
      expect(store.isCacheEnabled()).to.be.true;
    });

    it('should return a DataStore that is online and has cache disabled for DataStoreType.Network', function() {
      const store = DataStore.collection(null, DataStoreType.Network);
      expect(store.isOnline()).to.be.true;
      expect(store.isCacheEnabled()).to.be.false;
    });

    it('should accept a name as an argument', function() {
      const store = DataStore.collection(collection);
      expect(store.collection).to.equal(collection);
    });
  });
});

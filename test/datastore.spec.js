/* eslint-disable no-underscore-dangle */
import './setup';
import { DataStore, CacheStore, SyncStore } from '../src/datastore';
import { Client } from '../src/client';
import { KinveyError, NotFoundError } from '../src/errors';
import { Query } from '../src/query';
import { randomString } from '../src/utils/string';
// import nock from 'nock';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const collection = 'tests';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

describe('DataStore', function() {
  describe('constructor', function() {
    it('should throw an error if a collection name is not provided', function() {
      expect(function() {
        new DataStore(); // eslint-disable-line no-new
      }).to.throw(KinveyError, /A collection is required./);
    });

    it('should throw an error if the collection name is not a string', function() {
      expect(function() {
        new DataStore({}); // eslint-disable-line no-new
      }).to.throw(KinveyError, /Collection must be a string./);
    });

    it('should set the collection name', function() {
      const datastore = new DataStore(collection);
      expect(datastore.collection).to.equal(collection);
    });

    it('should set a client', function() {
      const datastore = new DataStore(collection);
      expect(datastore.client).to.not.be.undefined;
      expect(datastore.client).to.be.instanceof(Client);
    });
  });

  describe('pathname', function() {
    const datastore = new DataStore(collection);
    expect(datastore.pathname).to.equal(`/${appdataNamespace}/${datastore.client.appKey}/${collection}`);
  });

  describe('save()', function() {
   it('should call create() if the data does not have id', async function() {
      const datastore = new DataStore(collection);
      const stub = this.sandbox.stub(datastore, 'create');
      const data = { prop: randomString() };
      await datastore.save(data);
      expect(stub).to.have.been.calledOnce;
    });

    it('should call update() if the data has an id', async function() {
      const datastore = new DataStore(collection);
      const stub = this.sandbox.stub(datastore, 'update');
      const data = { _id: randomString(), prop: randomString() };
      await datastore.save(data);
      expect(stub).to.have.been.calledOnce;
    });
  });
});

describe('SyncStore', function() {
  before(function() {
    return this.login();
  });

  before(function() {
    this.syncStore = new SyncStore(collection);
  });

  before(function() {
    const data = { prop: randomString() };
    return this.syncStore.save(data).then(entity => {
      this.entity = entity;
    });
  });

  before(function() {
    const data = { prop: randomString() };
    return this.syncStore.save(data).then(entity => {
      this.entity2 = entity;
    });
  });

  after(function() {
    return this.syncStore.removeById(this.entity._id);
  });

  after(function() {
    return this.syncStore.removeById(this.entity2._id);
  });

  after(function() {
    return this.syncStore.clear();
  });

  after(function() {
    delete this.entity;
    delete this.entity2;
    delete this.syncStore;
  });

  after(function() {
    return this.logout();
  });

  describe('constructor', function() {
    it('it to be a subclass of CacheStore', function() {
      const syncStore = new SyncStore(collection);
      expect(syncStore).to.be.instanceof(CacheStore);
    });
  });

  describe('syncAutomatically', function() {
    it('should be false', function() {
      const syncStore = new SyncStore(collection);
      expect(syncStore.syncAutomatically).to.be.false;
    });

    it('should throw an error if it is tried to be set to a different value', function() {
      expect(function() {
        const syncStore = new SyncStore(collection);
        syncStore.syncAutomatically = true;
      }).to.throw(Error);
    });
  });

  describe('find()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.syncStore.find({}).toPromise();
      return expect(promise).to.be.rejected;
    });

    it('should return all entities when a query is not provided', function() {
      const promise = this.syncStore.find().toPromise();
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(2);
        expect(entities).to.have.deep.property('[0]').that.deep.equals(this.entity);
        expect(entities).to.have.deep.property('[1]').that.deep.equals(this.entity2);
      });
    });

    it('should return a subset of entities when a query is provided', function() {
      const query = new Query().equalTo('_id', this.entity._id);
      const promise = this.syncStore.find(query).toPromise();
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').that.deep.equals(this.entity);
      });
    });
  });

  describe('findById()', function() {
    it('should return undefined when an id is not provided', function() {
      const promise = this.syncStore.findById().toPromise();
      return promise.then(entity => {
        expect(entity).to.be.undefined;
      });
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const promise = this.syncStore.findById(randomString()).toPromise();
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should return the entity that matches the id', function() {
      const promise = this.syncStore.findById(this.entity._id).toPromise();
      return promise.then(entity => {
        expect(entity).to.deep.equal(this.entity);
      });
    });
  });

  describe('count()', function() {

  });
});

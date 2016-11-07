import './setup';
import { DataStoreType, DataStore, CacheStore, NetworkStore, SyncStore } from '../src/datastore';
import { Client } from '../src/client';
import { KinveyError, NotFoundError } from '../src/errors';
import { Query } from '../src/query';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const collection = 'tests';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

describe('NetworkStore', function() {
  before(function() {
    this.store = new NetworkStore(collection);
  });

  before(function() {
    const data = { prop: randomString() };

    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _id: randomString(),
        prop: data.prop
      }, {
        'content-type': 'application/json'
      });

    return this.store.save(data).then(entity => {
      this.entity = entity;
    });
  });

  before(function() {
    const data = { prop: randomString() };

    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _id: randomString(),
        prop: data.prop
      }, {
        'content-type': 'application/json'
      });

    return this.store.save(data).then(entity => {
      this.entity2 = entity;
    });
  });

  after(function() {
    delete this.entity;
    delete this.entity2;
    delete this.store;
  });

  describe('constructor', function() {
    it('should throw an error if the collection name is not a string', function() {
      expect(function() {
        new NetworkStore({}); // eslint-disable-line no-new
      }).to.throw(KinveyError, /Collection must be a string./);
    });

    it('should set the collection name', function() {
      const store = new NetworkStore(collection);
      expect(store.collection).to.equal(collection);
    });

    it('should set a client', function() {
      const store = new NetworkStore(collection);
      expect(store.client).to.not.be.undefined;
      expect(store.client).to.be.instanceof(Client);
    });

    it('it to be an instance of NetworkStore', function() {
      const store = new NetworkStore(collection);
      expect(store).to.be.instanceof(NetworkStore);
    });
  });

  describe('pathname', function() {
    const store = new NetworkStore(collection);
    expect(store.pathname).to.equal(`/${appdataNamespace}/${store.client.appKey}/${collection}`);
  });

  describe('find()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.store.find({}).toPromise();
      return expect(promise).to.be.rejected;
    });

    it('should return all entities when a query is not provided', function(done) {
      nock(this.client.baseUrl)
        .get(this.store.pathname, () => true)
        .query(true)
        .reply(200, [this.entity, this.entity2], {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.find();
      stream.subscribe(notifySpy, done, () => {
        expect(notifySpy).to.have.been.calledOnce;
        expect(notifySpy).to.be.calledWithExactly([this.entity, this.entity2]);
        done();
      });
    });

    it('should return a subset of entities that match the provided query', function(done) {
      nock(this.client.baseUrl)
        .get(this.store.pathname, () => true)
        .query(true)
        .reply(200, [this.entity], {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const query = new Query().equalTo('_id', this.entity._id);
      const stream = this.store.find(query);
      stream.subscribe(notifySpy, done, () => {
        expect(notifySpy).to.have.been.calledOnce;
        expect(notifySpy).to.be.calledWithExactly([this.entity]);
        done();
      });
    });
  });

  describe('findById()', function() {
    it('should return undefined when an id is not provided', function() {
      const promise = this.store.findById().toPromise();
      return expect(promise).to.eventually.be.undefined;
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const id = randomString();

      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/${id}`, () => true)
        .query(true)
        .reply(404, { name: 'EntityNotFound' }, {
          'content-type': 'application/json'
        });

      const promise = this.store.findById(id).toPromise();
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should return the entity that matches the id', function() {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/${this.entity._id}`, () => true)
        .query(true)
        .reply(200, this.entity, {
          'content-type': 'application/json'
        });

      const promise = this.store.findById(this.entity._id).toPromise();
      return expect(promise).to.eventually.deep.equal(this.entity);
    });
  });

  describe('count()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.store.count({}).toPromise();
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should return the count of all entities when a query is not provided', function() {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/_count`, () => true)
        .query(true)
        .reply(200, { count: 2 }, {
          'content-type': 'application/json'
        });

      const promise = this.store.count().toPromise();
      return expect(promise).to.eventually.equal(2);
    });

    it('should return the count of entities that match the provided query', function() {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/_count`, () => true)
        .query(true)
        .reply(200, { count: 1 }, {
          'content-type': 'application/json'
        });

      const query = new Query().equalTo('_id', this.entity._id);
      const promise = this.store.count(query).toPromise();
      return expect(promise).to.eventually.equal(1);
    });
  });

  describe('create()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.store.create();
      return expect(promise).to.eventually.be.null;
    });

    it('should create the data on the network', function() {
      const data = { prop: randomString() };

      nock(this.client.baseUrl)
        .post(this.store.pathname, () => true)
        .query(true)
        .reply(201, {
          _id: randomString(),
          prop: data.prop
        }, {
          'content-type': 'application/json'
        });

      const promise = this.store.create(data);
      return promise.then(entity => {
        expect(entity).to.have.property('_id');
        expect(entity).to.have.property('prop', data.prop);
      });
    });

    it('should accept an array of data', function() {
      const data = { prop: randomString() };

      nock(this.client.baseUrl)
        .post(this.store.pathname, () => true)
        .query(true)
        .reply(201, {
          _id: randomString(),
          prop: data.prop
        }, {
          'content-type': 'application/json'
        });

      const promise = this.store.create([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);
      });
    });
  });

  describe('update()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.store.update();
      return expect(promise).to.eventually.be.null;
    });

    it('should update the data on the network', function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const promise = this.store.update(data);
      return promise.then(entity => {
        expect(entity).to.have.property('_id');
        expect(entity).to.have.property('prop', data.prop);
      });
    });

    it('should accept an array of data', function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const promise = this.store.update([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);
      });
    });
  });

  describe('save()', function() {
    it('should call create() if the data does not have id', async function() {
      const store = new NetworkStore(collection);
      const stub = this.sandbox.stub(store, 'create');
      const data = { prop: randomString() };
      await store.save(data);
      expect(stub).to.have.been.calledOnce;
    });

    it('should call update() if the data has an id', async function() {
      const store = new NetworkStore(collection);
      const stub = this.sandbox.stub(store, 'update');
      const data = { _id: randomString(), prop: randomString() };
      await store.save(data);
      expect(stub).to.have.been.calledOnce;
    });
  });

  describe('remove()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.store.remove({});
      return expect(promise).to.be.rejected;
    });

    it('should remove the data on the network', async function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .delete(this.store.pathname, () => true)
        .query(true)
        .reply(200, [data], {
          'content-type': 'application/json'
        });

      const query = new Query();
      query.equalTo('_id', data._id);
      const promise = this.store.remove(query);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]')
          .that.deep.equals(data);
      });
    });
  });

  describe('removeById()', function() {
    it('should return undefined when an id is not provided', function() {
      const promise = this.store.removeById();
      return expect(promise).to.eventually.be.undefined;
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const id = randomString();

      nock(this.client.baseUrl)
        .delete(`${this.store.pathname}/${id}`, () => true)
        .query(true)
        .reply(404, { name: 'EntityNotFound' }, {
          'content-type': 'application/json'
        });

      const promise = this.store.removeById(id);
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should remove the entity that matches the id from the network', async function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .delete(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const promise = this.store.removeById(data._id);
      return promise.then(entity => {
        expect(entity).to.deep.equal(data);
      });
    });
  });
});

describe('CacheStore', function() {
  before(function() {
    this.store = DataStore.collection(collection, DataStoreType.Cache);
  });

  before(function() {
    const data = { prop: randomString() };

    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _id: randomString(),
        prop: data.prop
      }, {
        'content-type': 'application/json'
      });

    return this.store.save(data).then(entity => {
      this.entity = entity;
    });
  });

  before(function() {
    const data = { prop: randomString() };

    nock(this.client.baseUrl)
      .post(this.store.pathname, () => true)
      .query(true)
      .reply(200, {
        _id: randomString(),
        prop: data.prop
      }, {
        'content-type': 'application/json'
      });

    return this.store.save(data).then(entity => {
      this.entity2 = entity;
    });
  });

  after(function() {
    nock(this.client.baseUrl)
      .delete(`${this.store.pathname}/${this.entity._id}`, () => true)
      .query(true)
      .reply(204, null, {
        'content-type': 'application/json'
      });

    return this.store.removeById(this.entity._id);
  });

  after(function() {
    nock(this.client.baseUrl)
      .delete(`${this.store.pathname}/${this.entity._id}`, () => true)
      .query(true)
      .reply(204, null, {
        'content-type': 'application/json'
      });

    return this.store.removeById(this.entity2._id);
  });

  after(function() {
    return this.store.clear().then(() => this.store.clearSync());
  });

  after(function() {
    return this.store.syncCount().then(count => {
      expect(count).to.equal(0);
    });
  });

  after(function() {
    delete this.entity;
    delete this.entity2;
    delete this.store;
  });

  describe('constructor', function() {
    it('it to be an instance of CacheStore', function() {
      const store = new CacheStore(collection);
      expect(store).to.be.instanceof(CacheStore);
    });

    it('it to be a subclass of NetworkStore', function() {
      const store = new CacheStore(collection);
      expect(store).to.be.instanceof(NetworkStore);
    });
  });

  describe('syncAutomatically', function() {
    it('should be true', function() {
      expect(this.store.syncAutomatically).to.be.true;
    });

    it('should throw an error if it is tried to be set to a different value', function() {
      expect(function() {
        this.store.syncAutomatically = false;
      }).to.throw(Error);
    });
  });

  describe('find()', function() {
    it('should throw an error for an invalid query', function(done) {
      const notifySpy = this.sandbox.spy();
      const stream = this.store.find({});
      stream.subscribe(notifySpy, error => {
        expect(notifySpy).to.have.callCount(0);
        expect(error).to.be.instanceof(KinveyError);
        done();
      }, () => {
        done();
      });
    });

    it('should return all entities when a query is not provided', function(done) {
      nock(this.client.baseUrl)
        .get(this.store.pathname, () => true)
        .query(true)
        .reply(200, [this.entity, this.entity2], {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.find();
      stream.subscribe(notifySpy, error => {
        done(error);
      }, () => {
        expect(notifySpy).to.have.been.calledTwice;
        expect(notifySpy).to.be.calledWithExactly([this.entity, this.entity2]);
        done();
      });
    });

    it('should return a subset of entities that match the provided query', function(done) {
      nock(this.client.baseUrl)
        .get(this.store.pathname, () => true)
        .query(true)
        .reply(200, [this.entity], {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const query = new Query().equalTo('_id', this.entity._id);
      const stream = this.store.find(query);
      stream.subscribe(notifySpy, error => {
        done(error);
      }, () => {
        expect(notifySpy).to.have.been.calledTwice;
        expect(notifySpy).to.be.calledWithExactly([this.entity]);
        done();
      });
    });
  });

  describe('findById()', function() {
    it('should return undefined when an id is not provided', function(done) {
      const notifySpy = this.sandbox.spy();
      const stream = this.store.findById();
      stream.subscribe(notifySpy, error => {
        done(error);
      }, () => {
        expect(notifySpy).to.have.been.calledOnce;
        expect(notifySpy).to.be.calledWithExactly(undefined);
        done();
      });
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function(done) {
      const id = randomString();

      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/${id}`, () => true)
        .query(true)
        .reply(404, { name: 'EntityNotFound' }, {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.findById(id);
      stream.subscribe(notifySpy, error => {
        expect(notifySpy).to.have.callCount(0);
        expect(error).to.be.instanceof(NotFoundError);
        done();
      }, done);
    });

    it('should return the entity that matches the id', function(done) {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/${this.entity._id}`, () => true)
        .query(true)
        .reply(200, this.entity, {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.findById(this.entity._id);
      stream.subscribe(notifySpy, done, () => {
        expect(notifySpy).to.have.been.calledTwice;
        expect(notifySpy).to.be.calledWithExactly(this.entity);
        done();
      });
    });
  });

  describe('count()', function() {
    it('should throw an error for an invalid query', function(done) {
      const notifySpy = this.sandbox.spy();
      const stream = this.store.count({});
      stream.subscribe(notifySpy, error => {
        expect(notifySpy).to.have.callCount(0);
        expect(error).to.be.instanceof(KinveyError);
        done();
      }, done);
    });

    it('should return the count of all entities when a query is not provided', function(done) {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/_count`, () => true)
        .query(true)
        .reply(200, { count: 2 }, {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.count();
      stream.subscribe(notifySpy, done, () => {
        expect(notifySpy).to.have.been.calledTwice;
        expect(notifySpy).to.be.calledWithExactly(2);
        done();
      });
    });

    it('should return the count of entities that match the provided query', function(done) {
      nock(this.client.baseUrl)
        .get(`${this.store.pathname}/_count`, () => true)
        .query(true)
        .reply(200, { count: 1 }, {
          'content-type': 'application/json'
        });

      const notifySpy = this.sandbox.spy();
      const stream = this.store.count();
      stream.subscribe(notifySpy, done, () => {
        expect(notifySpy).to.have.been.calledTwice;
        expect(notifySpy).to.be.calledWithExactly(1);
        done();
      });
    });
  });

  describe('create()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.store.create();
      return expect(promise).to.eventually.be.null;
    });

    it('should create the data in the cache and sync the data with the network', async function() {
      const data = { prop: randomString() };
      const serverId = randomString();

      nock(this.client.baseUrl)
        .post(this.store.pathname, () => true)
        .query(true)
        .reply(201, {
          _id: serverId,
          prop: data.prop
        }, {
          'content-type': 'application/json'
        });

      const entity = await this.store.create(data);
      expect(entity).to.have.property('_id', serverId);
      expect(entity).to.have.property('prop', data.prop);

      const query = new Query().equalTo('entityId', entity._id);
      const syncCount = await this.store.syncCount(query);
      expect(syncCount).to.equal(0);
    });

    it('should accept an array of data', function() {
      const data = { prop: randomString() };

      nock(this.client.baseUrl)
        .post(this.store.pathname, () => true)
        .query(true)
        .reply(201, {
          _id: randomString(),
          prop: data.prop
        }, {
          'content-type': 'application/json'
        });

      const promise = this.store.create([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);

        const query = new Query().equalTo('entityId', entities[0]._id);
        return this.store.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(0);
        });
      });
    });
  });

  describe('update()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.store.update();
      return expect(promise).to.eventually.be.null;
    });

    it('should update the data in the cache and update the data on the backend', function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const promise = this.store.update(data);
      return promise.then(entity => {
        expect(entity).to.have.property('_id', data._id);
        expect(entity).to.have.property('prop', data.prop);

        const query = new Query().equalTo('entityId', entity._id);
        return this.store.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(0);
        });
      });
    });

    it('should accept an array of data', function() {
      const data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const promise = this.store.update([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);

        const query = new Query().equalTo('entityId', entities[0]._id);
        return this.store.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(0);
        });
      });
    });
  });

  describe('remove()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.store.remove({});
      return expect(promise).to.be.rejected;
    });

    it('should remove the data in the cache and sync with the backend', async function() {
      let data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      data = await this.store.update(data);

      nock(this.client.baseUrl)
        .delete(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const query = new Query();
      query.equalTo('_id', data._id);
      const promise = this.store.remove(query);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]')
          .that.deep.equals(data);

        const entity = entities[0];
        const query = new Query().equalTo('entityId', entity._id);
        return this.store.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(0);
        });
      });
    });
  });

  describe('removeById()', function() {
    it('should return undefined when an id is not provided', function() {
      const promise = this.store.removeById();
      return expect(promise).to.eventually.be.undefined;
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const promise = this.store.removeById(randomString());
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should remove the entity that matches the id and sync with the backend', async function() {
      let data = { _id: randomString(), prop: randomString() };

      nock(this.client.baseUrl)
        .put(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      data = await this.store.update(data);

      nock(this.client.baseUrl)
        .delete(`${this.store.pathname}/${data._id}`, () => true)
        .query(true)
        .reply(200, data, {
          'content-type': 'application/json'
        });

      const query = new Query();
      query.equalTo('_id', data._id);
      const promise = this.store.removeById(data._id);
      return promise.then(entity => {
        expect(entity).to.deep.equal(data);

        const query = new Query().equalTo('entityId', entity._id);
        return this.store.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(0);
        });
      });
    });
  });
});

describe('SyncStore', function() {
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
    return this.syncStore.clear().then(() => this.syncStore.clearSync());
  });

  after(function() {
    return this.syncStore.syncCount().then(count => {
      expect(count).to.equal(0);
    });
  });

  after(function() {
    delete this.entity;
    delete this.entity2;
    delete this.syncStore;
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

    it('should return a subset of entities that match the provided query', function() {
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
      return expect(promise).to.eventually.be.undefined;
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const promise = this.syncStore.findById(randomString()).toPromise();
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should return the entity that matches the id', function() {
      const promise = this.syncStore.findById(this.entity._id).toPromise();
      return expect(promise).to.eventually.deep.equal(this.entity);
    });
  });

  describe('count()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.syncStore.count({}).toPromise();
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should return the count of all entities when a query is not provided', function() {
      const promise = this.syncStore.count().toPromise();
      return expect(promise).to.eventually.equal(2);
    });

    it('should return the count of entities that match the provided query', function() {
      const query = new Query().equalTo('_id', this.entity._id);
      const promise = this.syncStore.count(query).toPromise();
      return expect(promise).to.eventually.equal(1);
    });
  });

  describe('create()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.syncStore.create();
      return expect(promise).to.eventually.be.null;
    });

    it('should create the data in the cache and add a create operation to the sync table', function() {
      const data = { prop: randomString() };
      const promise = this.syncStore.create(data);
      return promise.then(entity => {
        expect(entity).to.have.property('_id');
        expect(entity).to.have.property('prop', data.prop);

        const query = new Query().equalTo('entityId', entity._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('state').that.deep.equals({ method: 'POST' });
        });
      });
    });

    it('should accept an array of data', function() {
      const data = { prop: randomString() };
      const promise = this.syncStore.create([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);

        const entity = entities[0];
        const query = new Query().equalTo('entityId', entity._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('state').that.deep.equals({ method: 'POST' });
        });
      });
    });
  });

  describe('update()', function() {
    it('should return null when data is not provided', function() {
      const promise = this.syncStore.update();
      return expect(promise).to.eventually.be.null;
    });

    it('should update the data in the cache and add a update operation to the sync table', function() {
      const data = { _id: randomString(), prop: randomString() };
      const promise = this.syncStore.update(data);
      return promise.then(entity => {
        expect(entity).to.have.property('_id');
        expect(entity).to.have.property('prop', data.prop);

        const query = new Query().equalTo('entityId', entity._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('state').that.deep.equals({ method: 'PUT' });
        });
      });
    });

    it('should accept an array of data', function() {
      const data = { _id: randomString(), prop: randomString() };
      const promise = this.syncStore.update([data]);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]').to.have.property('_id');
        expect(entities).to.have.deep.property('[0]').to.have.property('prop', data.prop);

        const entity = entities[0];
        const query = new Query().equalTo('entityId', entities[0]._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]').to.have.property('state').that.deep.equals({ method: 'PUT' });
        });
      });
    });
  });

  describe('remove()', function() {
    it('should throw an error for an invalid query', function() {
      const promise = this.syncStore.remove({});
      return expect(promise).to.be.rejected;
    });

    it('should remove the data in the cache and add a delete operation to the sync table', async function() {
      let data = { _id: randomString(), prop: randomString() };
      data = await this.syncStore.update(data);
      const query = new Query();
      query.equalTo('_id', data._id);
      const promise = this.syncStore.remove(query);
      return promise.then(entities => {
        expect(entities).to.be.instanceof(Array);
        expect(entities.length).to.equal(1);
        expect(entities).to.have.deep.property('[0]')
          .that.deep.equals(data);

        const entity = entities[0];
        const query = new Query().equalTo('entityId', entity._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]')
            .to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]')
            .to.have.property('state')
            .that.deep.equals({ method: 'DELETE' });
        });
      });
    });
  });

  describe('removeById()', function() {
    it('should return undefined when an id is not provided', function() {
      const promise = this.syncStore.removeById();
      return expect(promise).to.eventually.be.undefined;
    });

    it('should throw a NotFoundError if an entity does not exist that matches the id', function() {
      const promise = this.syncStore.removeById(randomString());
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });

    it('should remove the entity that matches the id and add a delete operation to the sync table', async function() {
      let data = { _id: randomString(), prop: randomString() };
      data = await this.syncStore.update(data);
      const query = new Query();
      query.equalTo('_id', data._id);
      const promise = this.syncStore.removeById(data._id);
      return promise.then(entity => {
        expect(entity).to.deep.equal(data);

        const query = new Query().equalTo('entityId', entity._id);
        return this.syncStore.pendingSyncEntities(query).then(syncItems => {
          expect(syncItems).to.be.instanceof(Array);
          expect(syncItems.length).to.equal(1);
          expect(syncItems).to.have.deep.property('[0]')
            .to.have.property('collection', this.syncStore.collection);
          expect(syncItems).to.have.deep.property('[0]')
            .to.have.property('state')
            .that.deep.equals({ method: 'DELETE' });
        });
      });
    });
  });
});

describe('DataStore', function() {
  describe('constructor', function() {
    it('should throw an error', function() {
      expect(function() {
        new DataStore(); // eslint-disable-line no-new
      }).to.throw(KinveyError);
    });
  });

  describe('collection()', function() {
    it('should throw an error if a collection name is not provided', function() {
      expect(function() {
        DataStore.collection(); // eslint-disable-line no-new
      }).to.throw(KinveyError, /A collection is required./);
    });
  });
});

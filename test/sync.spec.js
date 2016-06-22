import './setup';
import { SyncManager } from '../src/sync';
import { SyncError } from '../src/errors';
import { SyncStore } from '../src/datastore';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const collection = 'test';

describe('Sync', function () {
  beforeEach(function() {
    this.sync = new SyncManager(collection, {
      client: this.client
    });
  });

  afterEach(function() {
    return this.sync.clear();
  });

  afterEach(function() {
    delete this.sync;
  });

  describe('count', function() {
    beforeEach(function() {
      return this.sync.addUpdateOperation({
        _id: randomString()
      });
    });

    beforeEach(function() {
      return this.sync.addUpdateOperation({
        _id: randomString()
      });
    });

    it('should return the count for all entities that need to be synced', function() {
      return this.sync.count().then(count => {
        expect(count).to.equal(2);
      });
    });

    it('should return the count that matches the query');
  });

  describe('addCreateOperation', function() {
    it('should reject the promise when an entity does not contain and _id', function() {
      const promise = this.sync.addCreateOperation(collection, {
        prop: randomString()
      });
      return expect(promise).to.be.rejectedWith(SyncError);
    });

    it('should accept a single entity', function() {
      const entity = {
        _id: randomString()
      };
      const promise = this.sync.addCreateOperation(entity);
      return expect(promise).to.eventually.deep.equal(entity);
    });

    it('should accept an array of entities', function() {
      const entities = [{
        _id: randomString()
      }];
      const promise = this.sync.addCreateOperation(entities);
      return expect(promise).to.eventually.deep.equal(entities);
    });

    it('should add entities to the sync table', function() {
      const entities = [{
        _id: randomString()
      }];
      return this.sync.addCreateOperation(entities)
        .then(() => this.sync.count())
        .then(count => {
          expect(count).to.equal(entities.length);
        });
    });
  });

  describe('addDeleteOperation', function() {
    it('should reject the promise when an entity does not contain and _id', function() {
      const promise = this.sync.addDeleteOperation({
        prop: randomString()
      });
      return expect(promise).to.be.rejectedWith(SyncError);
    });

    it('should accept a single entity', function() {
      const entity = {
        _id: randomString()
      };
      const promise = this.sync.addDeleteOperation(entity);
      return expect(promise).to.eventually.deep.equal(entity);
    });

    it('should accept an array of entities', function() {
      const entities = [{
        _id: randomString()
      }];
      const promise = this.sync.addDeleteOperation(entities);
      return expect(promise).to.eventually.deep.equal(entities);
    });

    it('should add entities to the sync table', function() {
      const entities = [{
        _id: randomString()
      }];
      return this.sync.addDeleteOperation(entities)
        .then(() => this.sync.count())
        .then(count => {
          expect(count).to.equal(entities.length);
        });
    });
  });

  describe('push', function() {
    it('should save an entity to the network', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);

      nock(this.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      const result = await this.sync.push();
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
      expect(this.sync.count()).to.eventually.equal(0);
    });

    it('should delete an entity from the network', async function() {
      const store = new SyncStore(collection);
      let entity = {
        _id: randomString(),
        prop: randomString()
      };
      entity = await store.save(entity);
      await store.removeById(entity._id);

      nock(this.client.baseUrl)
        .delete(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(204);

      const result = await this.sync.push();
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
    });

    it('should not delete an entity on the network if it was created locally', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);
      await store.removeById(entity._id);
      const result = await this.sync.push();
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
      expect(result).to.deep.equal([]);
    });

    it('should succeed after a failed push attempt when creating an entity', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);
      let result = await store.push();

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('error');

      nock(this.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      result = await store.push();
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
      expect(result[0]).to.not.have.property('error');
      expect(store.syncCount()).to.eventually.equal(0);
    });

    it('should succeed after a failed push attempt when updating an entity', async function() {
      const store = new SyncStore(collection);
      let entity = {
        _id: randomString(),
        prop: randomString()
      };
      entity = await store.save(entity);
      let result = await store.push();

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.have.property('error');

      nock(this.client.baseUrl)
        .put(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      result = await store.push();
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
      expect(result[0]).to.not.have.property('error');
      expect(store.syncCount()).to.eventually.equal(0);
    });
  });
});

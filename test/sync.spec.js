import './setup';
import Sync from '../src/sync';
import { Query } from '../src/query';
import { SyncError } from '../src/errors';
import { DataStore } from '../src/datastore';
import { loginUser, logoutUser } from './utils/user';
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
    return loginUser.call(this);
  });

  afterEach(function() {
    return logoutUser.call(this);
  });

  beforeEach(function() {
    this.sync = new Sync();
    this.sync.client = this.client;
  });

  afterEach(function() {
    return this.sync.clear();
  });

  afterEach(function() {
    delete this.sync;
  });

  describe('count', function() {
    beforeEach(function() {
      return this.sync.addUpdateOperation(collection, {
        _id: randomString()
      });
    });

    beforeEach(function() {
      return this.sync.addUpdateOperation(randomString(), {
        _id: randomString()
      });
    });

    it('should return the count for all entities that need to be synced', function() {
      return this.sync.count().then(count => {
        expect(count).to.equal(2);
      });
    });

    it('should return the count that matches the query', function() {
      const query = new Query();
      query.equalTo('collection', collection);
      return this.sync.count(query).then(count => {
        expect(count).to.equal(1);
      });
    });
  });

  describe('addCreateOperation', function() {
    it('should respond', function() {
      expect(Sync).to.respondTo('addCreateOperation');
    });

    it('should reject the promise when a name is not provided', function() {
      const promise = this.sync.addCreateOperation();
      return expect(promise).to.be.rejectedWith(SyncError);
    });

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
      const promise = this.sync.addCreateOperation(collection, entity);
      return expect(promise).to.eventually.deep.equal(entity);
    });

    it('should accept an array of entities', function() {
      const entities = [{
        _id: randomString()
      }];
      const promise = this.sync.addCreateOperation(collection, entities);
      return expect(promise).to.eventually.deep.equal(entities);
    });

    it('should add entities to the sync table', function() {
      const entities = [{
        _id: randomString()
      }];
      return this.sync.addCreateOperation(collection, entities).then(() => {
        const query = new Query();
        query.equalTo('collection', collection);
        return this.sync.count(query);
      }).then(count => {
        expect(count).to.equal(entities.length);
      });
    });
  });

  describe('addDeleteOperation', function() {
    it('should respond', function() {
      expect(Sync).to.respondTo('addDeleteOperation');
    });

    it('should reject the promise when a name is not provided', function() {
      const promise = this.sync.addDeleteOperation();
      return expect(promise).to.be.rejectedWith(SyncError);
    });

    it('should reject the promise when an entity does not contain and _id', function() {
      const promise = this.sync.addDeleteOperation(collection, {
        prop: randomString()
      });
      return expect(promise).to.be.rejectedWith(SyncError);
    });

    it('should accept a single entity', function() {
      const entity = {
        _id: randomString()
      };
      const promise = this.sync.addDeleteOperation(collection, entity);
      return expect(promise).to.eventually.deep.equal(entity);
    });

    it('should accept an array of entities', function() {
      const entities = [{
        _id: randomString()
      }];
      const promise = this.sync.addDeleteOperation(collection, entities);
      return expect(promise).to.eventually.deep.equal(entities);
    });

    it('should add entities to the sync table', function() {
      const entities = [{
        _id: randomString()
      }];
      return this.sync.addDeleteOperation(collection, entities).then(() => {
        const query = new Query();
        query.equalTo('collection', collection);
        return this.sync.count(query);
      }).then(count => {
        expect(count).to.equal(entities.length);
      });
    });
  });

  describe('push', function() {
    it('should respond', function() {
      expect(Sync).to.respondTo('push');
    });

    it('should save an entity to the network', async function() {
      const store = new DataStore(collection);
      store.offline();
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

      const query = new Query();
      query.equalTo('collection', store.collection);
      const result = await this.sync.push(query);
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
      expect(this.sync.count()).to.eventually.equal(0);
    });

    it('should delete an entity from the network', async function() {
      const store = new DataStore(collection);
      store.offline();
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

      const query = new Query();
      query.equalTo('collection', store.collection);
      const result = await this.sync.push(query);
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([{ _id: entity._id, entity: entity }]);
    });

    it('should not delete an entity on the network if it was created locally', async function() {
      const store = new DataStore(collection);
      store.offline();
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);
      await store.removeById(entity._id);
      const query = new Query();
      query.equalTo('collection', store.collection);
      const result = await this.sync.push(query);
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
      expect(result).to.deep.equal([]);
    });
  });
});

import './setup';
import Sync from '../src/sync';
import { Query } from '../src/query';
import { KinveyError, SyncError } from '../src/errors';
// import { loginUser, logoutUser } from './utils/user';
import { randomString } from '../src/utils/string';
// import nock from 'nock';
import chai from 'chai';
const expect = chai.expect;
const collectionName = 'test';

describe('Sync', function () {
  beforeEach(function() {
    this.sync = new Sync();
    this.sync.client = this.client;
  });

  afterEach(function() {
    delete this.sync;
  });

  describe('count', function() {
    beforeEach(function() {
      return this.sync.notify(collectionName, {
        _id: randomString()
      });
    });

    beforeEach(function() {
      return this.sync.notify(randomString(), {
        _id: randomString()
      });
    });

    afterEach(function() {
      return this.sync.clear();
    });

    it('should return the count for all entities that need to be synced', function() {
      return this.sync.count().then(count => {
        expect(count).to.equal(2);
      });
    });

    it('should return the count that matches the query', function() {
      const query = new Query();
      query.contains('_id', collectionName);
      return this.sync.count(query).then(count => {
        expect(count).to.equal(1);
      });
    });
  });

  describe('notify', function() {
    afterEach(function() {
      return this.sync.clear();
    });

    it('should reject the promise when a name is not provided', function() {
      const promise = this.sync.notify();
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should reject the promise when an entity does not contain and _id', function() {
      const promise = this.sync.notify(collectionName, {
        prop: randomString()
      });
      return expect(promise).to.be.rejectedWith(SyncError);
    });

    it('should accept a single entity', function() {
      const entity = {
        _id: randomString()
      };
      const promise = this.sync.notify(collectionName, entity);
      return expect(promise).to.eventually.deep.equal(entity);
    });

    it('should accept an array of entities', function() {
      const entities = [{
        _id: randomString()
      }];
      const promise = this.sync.notify(collectionName, entities);
      return expect(promise).to.eventually.deep.equal(entities);
    });

    it('should add entities to the sync table', function() {
      const entities = [{
        _id: randomString()
      }];
      return this.sync.notify(collectionName, entities).then(() => {
        const query = new Query();
        query.contains('_id', collectionName);
        return this.sync.count(query);
      }).then(count => {
        expect(count).to.equal(entities.length);
      });
    });
  });
});

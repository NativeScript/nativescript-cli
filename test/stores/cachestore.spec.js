import '../setup';
import { loginUser, logoutUser } from '../utils/user';
import { CacheStore } from '../../src/stores/cachestore';
import { KinveyError, NotFoundError } from '../../src/errors';
import { Query } from '../../src/query';
import { randomString } from '../../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('CacheStore', function() {
  before(function() {
    return loginUser.call(this);
  });

  after(function() {
    return logoutUser.call(this);
  });

  before(function() {
    this.store = new CacheStore('kinveytests');
  });

  after(function() {
    delete this.store;
  });

  it('should set name with constructor', function() {
    const name = 'foo';
    const store = new CacheStore(name);
    expect(store.name).to.equal(name);
  });

  it('should throw a KinveyError if name is not a string', function() {
    expect(function() {
      const store = new CacheStore({});
      return store;
    }).to.throw(KinveyError);
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
      nock(this.client.baseUrl)
        .put(`${this.store._pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      return this.store.save(entity).then(entity => {
        this.entity = entity;
      }).catch(error => {
        console.log(error);
      });
    });

    afterEach(function() {
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${this.entity._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      return this.store.removeById(this.entity._id).then(() => {
        delete this.entity;
      });
    });

    it('should be a function', function() {
      expect(CacheStore).to.respondTo('find');
    });

    it('should return all entities when using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // Delta response
      nock(this.client.baseUrl)
        .get(this.store._pathname)
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

      // Fetch response
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, [entity2], {
          'content-type': 'application/json'
        });

      // Delete response
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      // Perform find
      return this.store.find().then(result => {
        // Expect entities to be all entities in the cache
        const entities = result.cache;
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities).to.deep.equal([this.entity]);
        return result.networkPromise;
      }).then(entities => {
        // Expect entities to be a merge of the cache and network entities
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(2);
        expect(entities).to.deep.equal([entity2, this.entity]);
      }).then(() => this.store.removeById(entity2._id));
    });

    it('should return all entities when not using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // Fetch response
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, [this.entity, entity2], {
          'content-type': 'application/json'
        });

      // Delete response
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      // Perform find
      return this.store.find(null, { useDeltaFetch: false }).then(result => {
        // Expect entities to be all entities in the cache
        const entities = result.cache;
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities).to.deep.equal([this.entity]);
        return result.networkPromise;
      }).then(entities => {
        // Expect entities to be a merge of the cache and network entities
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(2);
        expect(entities).to.deep.equal([this.entity, entity2]);
      }).then(() => this.store.removeById(entity2._id));
    });

    it('should throw a KinveyError when provided an invalid query', function() {
      expect(this.store.find({})).to.be.rejectedWith(KinveyError);
    });

    it('should return all entities matching the query when using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // Create a query
      const query = new Query();
      query.equalTo('_id', entity2);

      // Fetch response
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, [entity2], {
          'content-type': 'application/json'
        });

      // Delete response
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      // Perform find
      return this.store.find(query).then(result => {
        // Expect entities to be all entities in the cache matching the query
        const entities = result.cache;
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(0);
        expect(entities).to.deep.equal([]);
        return result.networkPromise;
      }).then(entities => {
        // Expect entities to be a merge of the cache and network entities matching the query
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities).to.deep.equal([entity2]);
      }).then(() => this.store.removeById(entity2._id));
    });

    it('should return all entities matching the query when not using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // Create a query
      const query = new Query();
      query.equalTo('_id', entity2);

      // Fetch response
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, [entity2], {
          'content-type': 'application/json'
        });

      // Delete response
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      // Perform find
      return this.store.find(query, { useDeltaFetch: false }).then(result => {
        // Expect entities to be all entities in the cache matching the query
        const entities = result.cache;
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(0);
        expect(entities).to.deep.equal([]);
        return result.networkPromise;
      }).then(entities => {
        // Expect entities to be a merge of the cache and network entities matching the query
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities).to.deep.equal([entity2]);
      }).then(() => this.store.removeById(entity2._id));
    });
  });

  describe('findById()', function() {
    beforeEach(function() {
      const entity = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };
      nock(this.client.baseUrl)
        .put(`${this.store._pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      return this.store.save(entity).then(entity => {
        this.entity = entity;
      });
    });

    afterEach(function() {
      nock(this.client.baseUrl)
        .delete(`${this.store._pathname}/${this.entity._id}`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      return this.store.removeById(this.entity._id).then(() => {
        delete this.entity;
      });
    });

    it('should throw a NotFoundError when the entity does not exist when using delta fetch', function() {
      // Fetch response
      const id = randomString();
      nock(this.client.baseUrl)
        .get(`${this.store._pathname}/${id}`)
        .query(true)
        .reply(404, null, {
          'content-type': 'application/json'
        });

      // Perform findById
      return this.store.findById(id).then(result => {
        const entity = result.cache;
        expect(entity).to.be.null;
        return result.networkPromise;
      }).catch(error => {
        expect(error).to.be.instanceof(NotFoundError);
      });
    });

    it('should throw a NotFoundError when the entity does not exist when not using delta fetch', function() {
      // Fetch response
      const id = randomString();
      nock(this.client.baseUrl)
        .get(`${this.store._pathname}/${id}`)
        .query(true)
        .reply(404, null, {
          'content-type': 'application/json'
        });

      // Perform findById
      return this.store.findById(id, { useDeltaFetch: false }).then(result => {
        const entity = result.cache;
        expect(entity).to.be.null;
        return result.networkPromise;
      }).catch(error => {
        expect(error).to.be.instanceof(NotFoundError);
      });
    });

    it('should return the entity when using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // GET response
      nock(this.client.baseUrl)
        .get(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, entity2, {
          'content-type': 'application/json'
        });

      // Perform findById
      return this.store.findById(entity2._id).then(result => {
        const entity = result.cache;
        expect(entity).to.be.null;
        return result.networkPromise;
      }).then(entity => {
        expect(entity).to.deep.equal(entity2);
      });
    });

    it('should return the entity when not using delta fetch', function() {
      // Create a second entity
      const entity2 = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toUTCString()
        },
        _acl: {},
        prop: randomString()
      };

      // GET response
      nock(this.client.baseUrl)
        .get(`${this.store._pathname}/${entity2._id}`)
        .query(true)
        .reply(200, entity2, {
          'content-type': 'application/json'
        });

      // Perform findById
      return this.store.findById(entity2._id, { useDeltaFetch: false }).then(result => {
        const entity = result.cache;
        expect(entity).to.be.null;
        return result.networkPromise;
      }).then(entity => {
        expect(entity).to.deep.equal(entity2);
      });
    });
  });
});

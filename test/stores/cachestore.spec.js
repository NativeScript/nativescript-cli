import '../setup';
import { loginUser, logoutUser } from '../utils/user';
import { CacheStore } from '../../src/stores/cachestore';
import { KinveyError } from '../../src/errors';
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
    return loginUser();
  });

  after(function() {
    return logoutUser();
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

  it('should throw an error if name is not a string', function() {
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
        name: randomString()
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

    it('should be a function', function() {
      expect(CacheStore).to.respondTo('find');
    });

    it('should return a result with cached entities and a network promise', function() {
      const reply = [this.entity];
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return this.store.find().then(result => {
        const cache = result.cache;
        expect(cache).to.be.an('array');
        expect(cache).to.have.length(1);
        expect(cache).to.deep.equal([this.entity]);
        return result.networkPromise;
      }).then(entities => {
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(1);
        expect(entities).to.deep.equal(reply);
      });
    });
  });
});

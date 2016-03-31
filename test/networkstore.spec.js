import { UserHelper } from './helper';
import { NetworkStore } from '../src/stores/networkstore';
import { KinveyError } from '../src/errors';
import nock from 'nock';
import chai from 'chai';
const expect = chai.expect;

describe('NetworkStore', function() {
  before(function() {
    return UserHelper.login();
  });

  after(function() {
    return UserHelper.logout();
  });

  before(function() {
    this.store = new NetworkStore('kinvey');
  });

  after(function() {
    delete this.store;
  });

  it('should set name with constructor', function() {
    const name = 'test';
    const store = new NetworkStore(name);
    expect(store.name).to.equal(name);
  });

  it('should throw an error if name is not a string', function() {
    expect(function() {
      const store = new NetworkStore({});
      return store;
    }).to.throw(KinveyError);
  });

  describe('find()', function() {
    it('should be a function', function() {
      expect(NetworkStore).to.respondTo('find');
    });

    it('should return an empty array when the collection does not contain any entities', function() {
      const reply = [];
      nock(this.client.baseUrl)
        .get(this.store._pathname)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return this.store.find().then(entities => {
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(0);
      });
    });

    it('should return all entities in a collection');
  });
});

import { UserHelper } from 'tests/helpers';
import { NetworkStore } from 'kinvey-sdk-core/stores/datastore';
import { KinveyError } from 'kinvey-sdk-core/errors';
import nock from 'nock';
import url from 'url';
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
    const name = 'foo';
    const store = new NetworkStore(name);
    expect(store.name).to.equal(
      name);
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

    it('should return all entities in a collection', function() {
      const hostname = url.format({
        protocol: this.store.client.protocol,
        host: this.store.client.host
      });
      const server = nock(hostname).get(this.store._pathname);
      const reply = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: []
      };
      const scope = server.reply(reply.statusCode, reply.data, reply.headers);
      return this.store.find().then(entities => {
        expect(entities).to.be.an('array');
        expect(entities).to.have.length(0);

        // Make sure the scope is done
        scope.done();
      }).catch(error => {
        console.log(error);
        expect(error).to.be.null;
      });
    });
  });
});

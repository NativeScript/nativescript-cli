/**
 * Kinvey.Store.Sync test suite.
 */
describe('Kinvey.Store.Sync', function() {
  before(function() {
    this.store = new Kinvey.Store.Sync(COLLECTION_UNDER_TEST);
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Kinvey.Store.Sync#query
  describe('#query', function() {
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('loads an object using policy NO_CACHE.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.NO_CACHE });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.network.should.be['true'];
          done();
        }
      }));
    });
    it('loads an object using policy CACHE_ONLY.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_ONLY });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.local.should.be['true'];
          done();
        }
      }));
    });
    it('loads an object using policy CACHE_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_FIRST });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.local.should.be['true'];
          done();
        }
      }));
    });
    it('loads an inexistent object using policy CACHE_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_FIRST });
      this.store.query('foo', callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.network.should.be['true'];
          done();
        }
      }));
    });
    it('loads an object using policy NETWORK_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.NETWORK_FIRST });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.network.should.be['true'];
          done();
        }
      }));
    });
    it('loads an inexistent object using policy NETWORK_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.NETWORK_FIRST });
      this.store.query('foo', callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.local.should.be['true'];
          done();
        }
      }));
    });
    it('loads an object using policy BOTH.', function(done) {
      // We expect the success handler to be invoked twice.
      var pass = 0;

      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.BOTH });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');

          // First pass is local store, second is network store.
          if(1 === ++pass) {
            info.local.should.be['true'];
          }
          else {
            info.network.should.be['true'];
            done();
          }
        }
      }));
    });
  });

});
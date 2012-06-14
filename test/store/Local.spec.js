/**
 * Kinvey.Store.Local test suite.
 */
describe('Kinvey.Store.Local', function() {
  before(function() {
    this.store = new Kinvey.Store.Local(COLLECTION_UNDER_TEST);
  });
  after(function() {
    delete this.store;
  });

  // Kinvey.Store.Local#aggregate
  describe('#aggregate', function() {
    // Test suite.
    it('is not supported.', function(done) {
      this.store.removeWithQuery(null, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.local.should.be['true'];
          done();
        }
      });
    });
  });

  // Kinvey.Store.Local#query
  describe('#query', function() {
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('loads an object.', function(done) {
      var object = this.object;
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response.should.eql(object);
          info.local.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Local#queryWithQuery
  describe('#queryWithQuery', function() {
    // Test suite.
    it('is not supported.', function(done) {
      this.store.removeWithQuery(null, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.local.should.be['true'];
          done();
        }
      });
    });
  });

  // Kinvey.Store.Local#remove
  describe('#remove', function() {
    beforeEach(function(done) {
      this.object = { id: '_id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });

    // Test suite.
    it('removes an object.', function(done) {
      this.store.remove(this.object, callback(done));
    });
  });

  // Kinvey.Store.Local#removeWithQuery
  describe('#removeWithQuery', function() {
    // Test suite.
    it('is not supported.', function(done) {
      this.store.removeWithQuery(null, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.local.should.be['true'];
          done();
        }
      });
    });
  });

  // Kinvey.Store.Local#save
  describe('#save', function() {
    beforeEach(function() {
      this.object = { foo: 'bar' };
    });
    afterEach(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('saves a new object', function(done) {
      this.store.save(this.object, callback(done, {
        success: function(response, info) {
          (null != response._id).should.be['true'];
          response.foo.should.equal('bar');
          info.local.should.be['true'];
          done();
        }
      }));
    });
    it('updates an existing object.', function(done) {
      this.object._id = 'id';
      this.store.save(this.object, callback(done, {
        success: function(response, info) {
          response._id.should.equal('id');
          info.local.should.be['true'];
          done();
        }
      }));
    });
  });

});
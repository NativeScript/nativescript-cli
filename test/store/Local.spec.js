/**
 * Kinvey.Store.Local test suite.
 */
describe('Kinvey.Store.Local', function() {
  before(function() {
    this.store = new Kinvey.Store.Local(COLLECTION_UNDER_TEST);
  });
  after(function(done) {
    this.store.purge(callback(done));
  });

  // Kinvey.Store.Local#aggregate
  describe('#aggregate', function() {
    before(function(done) {
      // Build mock aggregation response.
      this.aggregation = new Kinvey.Aggregation();
      this.response = [{ count: 1 }];

      // Store mock.
      this.store.cacheAggregation(this.aggregation.toJSON(), this.response, callback(done));
    });

    // Test suite.
    it('performs an aggregation.', function(done) {
      var expected = this.response;
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.local.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Local#query
  describe('#query', function() {
    before(function(done) {
      // Build mock.
      this.object = { _id: 'my-id', foo: 'bar' };
      this.store.cacheObject(this.object, callback(done));
    });

    // Test suite.
    it('loads an object.', function(done) {
      var expected = this.object;
      this.store.query(expected._id, callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.local.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Local#queryWithQuery
  describe('#queryWithQuery', function() {
    before(function(done) {
      // Build mock query response.
      this.query = new Kinvey.Query();
      this.first = { _id: 'first', foo: 'bar' };
      this.second = { _id: 'second', foo: 'baz' };

      // Store mock.
      this.store.cacheQuery(this.query.toJSON(), [this.first, this.second], callback(done));
    });

    // Test suite.
    it('performs a query.', function(done) {
      var first = this.first;
      var second = this.second;
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0].should.eql(first);
          response[1].should.eql(second);
          info.local.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Local#remove
  describe('#remove', function() {
    beforeEach(function(done) {
      // Build mock.
      this.object = { _id: 'my-id', foo: 'bar' };
      this.store.cacheObject(this.object, callback(done));
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
    before(function() {
      this.object = { foo: 'bar' };
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
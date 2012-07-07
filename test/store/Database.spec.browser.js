/**
 * Kinvey.Database test suite.
 */
describe('Kinvey.Database', function() {
  // Create database.
  before(function() {
    // Database is not public, but we really want to test it. Therefore, grab
    // from CachedStore.
    this.database = new Kinvey.Store.Cached(COLLECTION_UNDER_TEST).db;
  });

  // Kinvey.Database#aggregate
  describe('#aggregate', function() {
    // Create mock.
    before(function(done) {
      this.aggregation = { foo: true };
      this.response = [ { foo: true, count: 1 } ];
      this.database.put('aggregate', this.aggregation, this.response, callback(done));
    });
    after(function(done) {
      this.database.put('aggregate', this.aggregation, null, callback(done));
    });

    // Test suite.
    it('performs an aggregation.', function(done) {
      var expected = this.response;
      this.database.aggregate(this.aggregation, callback(done, {
        success: function(response) {
          response.should.eql(expected);
          done();
        }
      }));
    });
    it('fails when the aggregation is not cached.', function(done) {
      this.database.aggregate({}, {
        success: function() {
          done(new Error('Success callback was invoked'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.DATABASE_ERROR);
          done();
        }
      });
    });
  });

  // Kinvey.Database#query
  describe('#query', function() {
    // Create mock.
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.database.save(this.object, callback(done, { silent: true }));
    });
    after(function(done) {
      this.database.remove(this.object, callback(done, { silent: true }));
    });

    // Test suite.
    it('loads an object.', function(done) {
      var expected = this.object;
      this.database.query(expected._id, callback(done, {
        success: function(response) {
          response.should.eql(expected);
          done();
        }
      }));
    });
    it('loads an nonexistent object.', function(done) {
      this.database.query('foo', {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.ENTITY_NOT_FOUND);
          done();
        }
      });
    });
  });

  // Kinvey.Database#queryWithQuery
  describe('#queryWithQuery', function() {
    // Create mock.
    before(function(done) {
      this.query = { foo: true };
      this.response = [ { _id: 'foo', bar: false }];
      this.database.put('queryWithQuery', this.query, this.response, callback(done));
    });
    after(function(done) {
      this.database.removeWithQuery(this.query, callback(done, { silent: true }));
    });

    // Test suite.
    it('performs a query.', function(done) {
      var expected = this.response;
      this.database.queryWithQuery(this.query, callback(done, {
        success: function(response) {
          response.should.eql(expected);
          done();
        }
      }));
    });
    it('fails when the query is not cached.', function(done) {
      this.database.queryWithQuery({}, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.DATABASE_ERROR);
          done();
        }
      });
    });
  });

  // Kinvey.Database#remove
  describe('#remove', function() {
    // Create mock.
    beforeEach(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.database.save(this.object, callback(done, { silent: true }));
    });

    // Test suite.
    it('removes an object.', function(done) {
      this.database.remove(this.object, callback(done, { silent: true }));
    });
    it('removes an nonexistent object.', function(done) {
      var mock = { _id: 'foo' };
      this.database.remove(mock, callback(done, { silent: true }));
    });
  });

  // Kinvey.Database#removeWithQuery
  describe('#removeWithQuery', function() {
    // Create mock.
    before(function(done) {
      this.query = { foo: true };
      this.response = [ { _id: 'foo', bar: false }];
      this.database.put('queryWithQuery', this.query, this.response, callback(done));
    });

    // Test suite.
    it('performs a removal by query.', function(done) {
      this.database.removeWithQuery(this.query, callback(done, { silent: true }));
    });
    it('fails when the query is not cached.', function(done) {
      this.database.removeWithQuery({}, {
        silent: true,
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.DATABASE_ERROR);
          done();
        }
      });
    });
  });

  // Kinvey.Database#save
  describe('#save', function() {
    // Create mock.
    beforeEach(function() {
      this.object = { foo: 'bar' };
    });
    afterEach(function(done) {
      this.database.remove(this.object, callback(done, { silent: true }));
    });

    // Test suite.
    it('creates a new object', function(done) {
      this.database.save(this.object, callback(done, {
        silent: true,
        success: function(response) {
          (null != response._id).should.be['true'];
          response.foo.should.equal('bar');
          done();
        }
      }));
    });
    it('updates an existing object.', function(done) {
      this.object._id = 'id';
      this.database.save(this.object, callback(done, {
        silent: true,
        success: function(response) {
          response._id.should.equal('id');
          done();
        }
      }));
    });
  });

});
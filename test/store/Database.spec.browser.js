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
  describe('.aggregate', function() {
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
  describe('.query', function() {
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

  // Kinvey.Database#query
  describe('.query [relational]', function() {
    // Housekeeping: create mocks.
    before(function(done) {
      // Object with one resolvable and one fake reference.
      this.object1 = {
        _id: 1,
        ref: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 2
        },
        fake: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 0
        }
      };

      // Object with reference, referenced by object above.
      this.object2 = {
        _id: 2,
        ref: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 3
        }
      };

      // Object with array reference, referenced by object above.
      this.object3 = {
        _id: 3,
        ref: [{
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 4
        }]
      };

      // Object without references, referenced by object above.
      this.object4 = {
        _id: 4,
        test: true
      };

      // Object with circular reference.
      this.object5 = {
        _id: 5,
        ref: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 5
        }
      };

      // Prepare.
      var objects = [this.object1, this.object2, this.object3, this.object4, this.object5];
      var pending = objects.length;

      // Save all.
      var database = this.database;
      objects.forEach(function(o) {
        database.save(o, callback(done, {
          success: function() {
            !--pending && done();
          },
          silent: true
        }));
      });
    });
    after(function(done) {
      // Prepare.
      var objects = [this.object1, this.object2, this.object3, this.object4, this.object5];
      var pending = objects.length;

      // Remove all.
      var database = this.database;
      objects.forEach(function(o) {
        database.remove(o, callback(done, {
          success: function() {
            !--pending && done();
          },
          silent: true
        }));
      });
    });

    // Test suite.
    it('does not resolve any reference.', function(done) {
      var base = this.object1;
      this.database.query(base._id, callback(done, {
        success: function(response) {
          response.should.eql(base);
          done();
        }
      }));
    });
    it('resolves a non-existant reference.', function(done) {
      this.database.query(this.object1._id, callback(done, {
        resolve: ['fake'],
        success: function(response) {
          (null === response.fake._obj).should.be['true'];
          done();
        }
      }));
    });
    it('resolves a property.', function(done) {
      var expected = this.object2;
      this.database.query(this.object1._id, callback(done, {
        resolve: ['ref'],
        success: function(response) {
          response.ref._obj.should.eql(expected);
          done();
        }
      }));
    });
    it('resolves a circular reference.', function(done) {
      var expected = this.object5;
      this.database.query(this.object5._id, callback(done, {
        resolve: ['ref'],
        success: function(response) {
          response.ref._obj.should.eql(expected);
          done();
        }
      }));
    });
    it('resolves a nested property.', function(done) {
      var expected = this.object3;
      this.database.query(this.object1._id, callback(done, {
        resolve: ['ref.ref'],
        success: function(response) {
          response.ref._obj.ref._obj.should.eql(expected);
          done();
        }
      }));
    });
    it('resolves an array member.', function(done) {
      var expected = this.object4;
      this.database.query(this.object3._id, callback(done, {
        resolve: ['ref'],
        success: function(response) {
          response.ref[0]._obj.should.eql(expected);
          done();
        }
      }));
    });
    it('resolves multiple references at once.', function(done) {
      var expected = this.object4;
      this.database.query(this.object1._id, callback(done, {
        resolve: ['fake', 'ref.ref.ref'],
        success: function(response) {
          // Test deepest reference. This makes sure all references are resolved.
          response.ref._obj.ref._obj.ref[0]._obj.should.eql(expected);
          (null === response.fake._obj).should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Database#queryWithQuery
  describe('.queryWithQuery', function() {
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

  // Kinvey.Database#queryWithQuery
  describe('.queryWithQuery [relational]', function() {
    // Housekeeping: create mocks.
    before(function(done) {
      this.object1 = {
        _id: 1,
        ref: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 2
        },
        fake: {
          _type: 'KinveyRef',
          _collection: COLLECTION_UNDER_TEST,
          _id: 0
        }
      };
      this.object2 = {
        _id: 2,
        test: true
      };

      // Prepare query.
      this.query = { foo: true };
      this.response = [ this.object1, this.object2 ];
      this.database.put('queryWithQuery', this.query, this.response, callback(done));
    });
    after(function(done) {
      this.database.removeWithQuery(this.query, callback(done, { silent: true }));
    });

    // Test suite.
    it('does not resolve any reference.', function(done) {
      var expected = this.object1;
      this.database.queryWithQuery(this.query, callback(done, {
        success: function(list) {
          list.should.have.length(2);
          list[0].should.eql(expected);
          done();
        }
      }));
    });
    it('resolves a non-existant reference.', function(done) {
      this.database.queryWithQuery(this.query, callback(done, {
        resolve: ['fake'],
        success: function(list) {
          list.should.have.length(2);
          (null === list[0].fake._obj).should.be['true'];
          done();
        }
      }));
    });
    it('resolves a property.', function(done) {
      var expected = this.object2;
      this.database.queryWithQuery(this.query, callback(done, {
        resolve: ['ref'],
        success: function(list) {
          list.should.have.length(2);
          list[0].ref._obj.should.eql(expected);
          done();
        }
      }));
    });
    it('resolves multiple references at once.', function(done) {
      var expected = this.object2;
      this.database.queryWithQuery(this.query, callback(done, {
        resolve: ['fake', 'ref'],
        success: function(list) {
          list.should.have.length(2);
          (null === list[0].fake._obj).should.be['true'];
          list[0].ref._obj.should.eql(expected);
          done();
        }
      }));
    });
  });

  // Kinvey.Database#remove
  describe('.remove', function() {
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
  describe('.removeWithQuery', function() {
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
  describe('.save', function() {
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
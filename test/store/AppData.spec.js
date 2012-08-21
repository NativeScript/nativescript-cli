/**
 * Kinvey.Store.AppData test suite.
 */
describe('Kinvey.Store.AppData', function() {
  before(function() {
    this.store = new Kinvey.Store.AppData(COLLECTION_UNDER_TEST);
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Kinvey.Store.AppData#aggregate
  describe('.aggregate', function() {
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('aggregates data.', function(done) {
      this.store.aggregate({
        finalize: function() { }.toString(),
        key: { },
        initial: { count: 0 },
        reduce: function(doc, out) {
          out.count++;
        }.toString()
      }, callback(done, {
        success: function(response, info) {
          response.should.have.length(1);
          response[0].count.should.equal(1);
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.AppData#query
  describe('.query', function() {
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
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.AppData#queryWithQuery
  describe('.queryWithQuery', function() {
    // Create mock.
    beforeEach(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });

    // Test suite.
    it('queries the store.', function(done) {
      var query = new Kinvey.Query();
      query.on('foo').equal('bar');
      this.store.queryWithQuery(query, callback(done, {
        success: function(response, info) {
          response.should.have.length(1);
          response[0].foo.should.equal('bar');
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

  // Kinvey.Store.AppData#remove
  describe('.remove', function() {
    beforeEach(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done));
    });

    // Test suite.
    it('removes an object.', function(done) {
      this.store.remove(this.object, callback(done));
    });
  });

  // Kinvey.Store.AppData#removeWithQuery
  describe('.removeWithQuery', function() {
    beforeEach(function(done) {
      this.store.save(this.object, callback(done));
    });

    // Test suite.
    it('deletes based on a query.', function(done) {
      this.store.removeWithQuery(new Kinvey.Query(), callback(done));
    });
  });

  // Kinvey.Store.AppData#save
  describe('.save', function() {
    beforeEach(function() {
      this.object = { foo: 'bar' };
    });
    afterEach(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('saves a new object', function(done) {
      var self = this;
      this.store.save(this.object, callback(done, {
        success: function(response, info) {
          (null != response._id).should.be['true'];
          response.foo.should.equal('bar');
          info.network.should.be['true'];

          // Update object, so it can be removed in afterEach().
          self.object = response;

          done();
        }
      }));
    });
    it('updates an existing object.', function(done) {
      this.object._id = 'id';
      this.store.save(this.object, callback(done, {
        success: function(response, info) {
          response._id.should.equal('id');
          info.network.should.be['true'];
          done();
        }
      }));
    });
  });

});
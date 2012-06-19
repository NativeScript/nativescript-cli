/**
 * Kinvey.Store.Sync test suite.
 */
describe('Kinvey.Store.Sync', function() {
  before(function() {
    this.store = new Kinvey.Store.Sync(COLLECTION_UNDER_TEST);
    this.local = this.store.local;
    this.network = this.store.network;
  });
  after(function(done) {
    var local = this.local;
    Kinvey.getCurrentUser().destroy(callback(done, {
      success: function() {
        local.purge(callback(done));
      }
    }));
  });
/*
  // Kinvey.Store.Sync#aggregate
  describe('#aggregate', function() {
    before(function(done) {
      // Aggregation will be a simple count.
      var aggregation = this.aggregation = new Kinvey.Aggregation();
      var response = this.response = [{ count: 1 }];

      // Create mock so remote response will be the same as above.
      var object = this.object = { _id: 'foo' };

      // Make sure aggregation is available locally.
      var local = this.local;
      this.store.save(object, callback(done, {
        success: function() {
          local.put('aggregation', aggregation.toJSON(), response, callback(done));
        }
      }));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done));
    });

    // Test suite.
    it('performs an aggregation using policy NO_CACHE.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Sync.NO_CACHE });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.network.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy CACHE_ONLY.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_ONLY });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.local.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy CACHE_FIRST.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_FIRST });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.local.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy NETWORK_FIRST.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Sync.NETWORK_FIRST });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.network.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy BOTH.', function(done) {
      // We expect the success handler to be invoked twice.
      var expected = this.response;
      var pass = 0;

      this.store.configure({ policy: Kinvey.Store.Sync.BOTH });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);

          // First pass is local store, second is network store.
          if(1 === ++pass) {
            info.local.should.be['true'];
          }
          else {
            info.network.should.be['true'];
          }
        }
      }));
    });
  });

  // Kinvey.Store.Sync#query
  describe('#query', function() {
    before(function(done) {
      var object = this.object = { _id: 'id', foo: 'bar' };
      var local = this.local;
      this.store.save(this.object, callback(done, {
        success: function() {
          local.put('query', null, object, callback(done));
        }
      }));
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
        }
      }));
    });
    it('loads an inexistent object using policy CACHE_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_FIRST });
      this.store.query('bar', callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.network.should.be['true'];
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
        }
      }));
    });
    it('loads an inexistent object using policy NETWORK_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Sync.NETWORK_FIRST });
      this.store.query('bar', callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.local.should.be['true'];
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
          }
        }
      }));
    });
  });

  // Kinvey.Store.Sync#queryWithQuery
  describe('#queryWithQuery', function() {
    before(function(done) {
      var first = this.first = { _id: 'first', foo: true };
      var second = this.second = { _id: 'second', foo: false };
      var query = this.query = new Kinvey.Query();

      // Create mock so remote response will be the same as above.
      var response = this.response = [this.first, this.second];
      var store = this.store;

      // Make sure query is available locally.
      this.local.put('queryWithQuery', query.toJSON(), response, callback(done, {
        success: function() {
          store.save(first, callback(done, {
            success: function() {
              store.save(second, callback(done));
            }
          }));
        }
      }));
    });
    after(function(done) {
      // Destroy mocks.
      var first = this.first;
      var store = this.store;
      store.remove(this.second, callback(done, {
        success: function() {
          store.remove(first, callback(done));
        }
      }));
    });

    // Test suite.
    it('queries the store using policy NO_CACHE', function(done) {
      this.store.configure({ policy: Kinvey.Store.Sync.NO_CACHE });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.network.should.be['true'];
        }
      }));
    });
    it('queries the store using policy CACHE_ONLY', function(done) {
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_ONLY });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.local.should.be['true'];
        }
      }));
    });
    it('queries the store using policy CACHE_FIRST', function(done) {
      this.store.configure({ policy: Kinvey.Store.Sync.CACHE_FIRST });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.local.should.be['true'];
        }
      }));
    });
    it('queries the store using policy NETWORK_FIRST', function(done) {
      this.store.configure({ policy: Kinvey.Store.Sync.NETWORK_FIRST });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.network.should.be['true'];
        }
      }));
    });
    it('queries the store using policy BOTH', function(done) {
      // We expect the success handler to be invoked twice.
      var pass = 0;

      this.store.configure({ policy: Kinvey.Store.Sync.BOTH });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');

          // First pass is local store, second is network store.
          if(1 === ++pass) {
            info.local.should.be['true'];
          }
          else {
            info.network.should.be['true'];
          }
        }
      }));
    });
  });
*/
  // Kinvey.Store.Sync#remove
  describe('#remove', function() {
    before(function(done) {
      this.object = { _id: 'foo', bar: 'baz' };
      this.network.save(this.object, callback(done));
    });

    // Test suite.
    it('removes and synchronizes an object.', function(done) {
      this.store.remove(this.object, callback(done, {
        success: function(_, info) {
          info.local.should.be['true'];
        }
      }));
    });
  });

  // Kinvey.Store.Sync#save
  describe('#save', function() {
    before(function(done) {
      this.object = { _id: 'foo', bar: 'baz' };
      this.network.save(this.object, callback(done));
    });
    after(function(done) {
      this.network.remove(this.object, callback(done));
    });

    // Test suite.
    it('saves and synchronizes an object.', function(done) {
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function(response, info) {
          response.should.eql(object);
          info.local.should.be['true'];
        }
      }));
    });
  });

});
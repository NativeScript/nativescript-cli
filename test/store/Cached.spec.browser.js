/**
 * Kinvey.Store.Cached test suite.
 */
describe('Kinvey.Store.Cached', function() {
  before(function() {
    this.store = new Kinvey.Store.Cached(COLLECTION_UNDER_TEST);
    this.cached = this.store.cached;
  });
  after(function(done) {
    var cached = this.cached;
    Kinvey.getCurrentUser().destroy(callback(done, {
      success: function() {
        cached.purge(callback(done));
      }
    }));
  });
  afterEach(function() {
    // Reset cache policy.
    this.store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
  });

  // Kinvey.Store.Cached#aggregate
  describe('#aggregate', function() {
    before(function(done) {
      // Aggregation will be a simple count.
      var aggregation = this.aggregation = new Kinvey.Aggregation();
      var response = this.response = [{ count: 1 }];

      // Create mock so remote response will be the same as above.
      var object = this.object = { _id: 'foo' };

      // Make sure aggregation is cached.
      var cached = this.cached;
      this.store.save(object, callback(done, { success: function() { },
        complete: function() {
          cached.put('aggregation', aggregation.toJSON(), response, callback(done));
        }
      }));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('performs an aggregation using policy NO_CACHE.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Cached.NO_CACHE });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.network.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy CACHE_ONLY.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_ONLY });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.cache.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy CACHE_FIRST.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_FIRST });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);
          info.cache.should.be['true'];
        }
      }));
    });
    it('performs an aggregation using policy NETWORK_FIRST.', function(done) {
      var expected = this.response;

      this.store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
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

      this.store.configure({ policy: Kinvey.Store.Cached.BOTH });
      this.store.aggregate(this.aggregation.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.eql(expected);

          // First pass is cached store, second is network store.
          if(1 === ++pass) {
            info.cache.should.be['true'];
          }
          else {
            info.network.should.be['true'];
          }
        }
      }));
    });
  });

  // Kinvey.Store.Cached#query
  describe('#query', function() {
    before(function(done) {
      this.object = { _id: 'id', foo: 'bar' };
      this.store.save(this.object, callback(done, { success: function() { } }));
    });
    after(function(done) {
      this.store.remove(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('loads an object using policy NO_CACHE.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Cached.NO_CACHE });
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
      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_ONLY });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.cache.should.be['true'];
        }
      }));
    });
    it('loads an object using policy CACHE_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_FIRST });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');
          info.cache.should.be['true'];
        }
      }));
    });
    it('loads an inexistent object using policy CACHE_FIRST.', function(done) {
      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_FIRST });
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
      this.store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
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
      this.store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
      this.store.query('bar', callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(_, info) {
          info.cache.should.be['true'];
        }
      }));
    });
    it('loads an object using policy BOTH.', function(done) {
      // We expect the success handler to be invoked twice.
      var pass = 0;

      var object = this.object;
      this.store.configure({ policy: Kinvey.Store.Cached.BOTH });
      this.store.query(object._id, callback(done, {
        success: function(response, info) {
          response._id.should.equal(object._id);
          response.foo.should.equal('bar');

          // First pass is cached store, second is network store.
          if(1 === ++pass) {
            info.cache.should.be['true'];
          }
          else {
            info.network.should.be['true'];
          }
        }
      }));
    });
  });

  // Kinvey.Store.Cached#queryWithQuery
  describe('#queryWithQuery', function() {
    before(function(done) {
      var first = this.first = { _id: 'first', foo: true };
      var second = this.second = { _id: 'second', foo: false };
      var query = this.query = new Kinvey.Query();

      // Create mock so remote response will be the same as above.
      var response = this.response = [this.first, this.second];
      var store = this.store;

      // Make sure query is in cached.
      this.cached.put('queryWithQuery', query.toJSON(), response, callback(done, {
        success: function() {
          store.save(first, callback(done, { success: function() { },
            complete: function() {
              store.save(second, callback(done, { success: function() { } }));
            }
          }));
        }
      }));
    });
    after(function(done) {
      // Destroy mocks.
      var first = this.first;
      var store = this.store;
      store.remove(this.second, callback(done, { success: function() { },
        complete: function() {
          store.remove(first, callback(done, { success: function() { } }));
        }
      }));
    });

    // Test suite.
    it('queries the store using policy NO_CACHE', function(done) {
      this.store.configure({ policy: Kinvey.Store.Cached.NO_CACHE });
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
      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_ONLY });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.cache.should.be['true'];
        }
      }));
    });
    it('queries the store using policy CACHE_FIRST', function(done) {
      this.store.configure({ policy: Kinvey.Store.Cached.CACHE_FIRST });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');
          info.cache.should.be['true'];
        }
      }));
    });
    it('queries the store using policy NETWORK_FIRST', function(done) {
      this.store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
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

      this.store.configure({ policy: Kinvey.Store.Cached.BOTH });
      this.store.queryWithQuery(this.query.toJSON(), callback(done, {
        success: function(response, info) {
          response.should.have.length(2);
          response[0]._id.should.equal('first');
          response[1]._id.should.equal('second');

          // First pass is cached store, second is network store.
          if(1 === ++pass) {
            info.cache.should.be['true'];
          }
          else {
            info.network.should.be['true'];
          }
        }
      }));
    });
  });

  // Kinvey.Store.Cached#remove
  describe('#remove', function() {
    beforeEach(function(done) {
      this.object = { _id: 'foo', bar: true };
      this.store.save(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('removes an object from both stores.', function(done) {
      var store = this.store;
      var object = this.object;
      var savedObject;

      store.configure({ policy: Kinvey.Store.Cached.NETWORK_FIRST });
      store.remove(object, callback(done, {
        success: function(response, info) {
          // Object should be stored to the network, and to cache in background.
          info.network.should.be['true'];
        },
        complete: function() {
          // Object is now persisted in cache, retrieve and test.
          store.configure({ policy: Kinvey.Store.Cached.CACHE_ONLY });
          store.query(object._id, callback(done, {
            success: function() {
              done(new Error('Success callback was invoked.'));
            },
            error: function(_, info) {
              info.cache.should.be['true'];
            }
          }));
        }
      }));
    });
  });

  // Kinvey.Store.Cached#removeWithQuery
  describe('#removeWithQuery', function() {
    beforeEach(function(done) {
      var query = this.query = new Kinvey.Query().on('bar').equal(true);
      var object = this.object = { _id: 'foo', bar: true };

      var cached = this.cached;
       this.store.save(this.object, callback(done, { success: function() { },
        complete: function() {
          cached.put('queryWithQuery', query.toJSON(), [object], callback(done));
        }
      }));
    });
    afterEach(function(done) {
      // Object is already removed remotely.
      this.cached.put('query', this.object._id, null, callback(done));
    });

    // Test suite.
    it('resets a cached query.', function(done) {
      var store = this.store;
      var query = this.query;
      store.removeWithQuery(query.toJSON(), callback(done, {
        success: function(_, info) {
          info.network.should.be['true'];
        },
        complete: function() {
          store.configure({ policy: Kinvey.Store.Cached.CACHE_ONLY });
          store.queryWithQuery(query.toJSON(), callback(done, {
            success: function(response, info) {
              info.cache.should.be['true'];
              response.should.have.length(0);
              done();
            }
          }));
        }
      }));
    });
  });

  // Kinvey.Store.Cached#save
  describe('#save', function() {
    beforeEach(function() {
      this.object = { _id: 'foo', bar: true };
    });
    afterEach(function(done) {
      this.store.remove(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('saves an object to both stores.', function(done) {
      var store = this.store;
      var object = this.object;
      var savedObject;

      store.configure({ policy: Kinvey.Store.Cached.CACHE_FIRST });
      store.save(object, callback(done, {
        success: function(response, info) {
          // Object should be stored to the network, and to cache in background.
          info.network.should.be['true'];

          // Save object, used for comparison later.
          savedObject = response;
        },
        complete: function() {
          // Object is now persisted in cache, retrieve and test.
          store.query(object._id, callback(done, {
            success: function(response, info) {
              response.should.eql(savedObject);
              info.cache.should.be['true'];
            }
          }));
        }
      }));
    });
  });

});
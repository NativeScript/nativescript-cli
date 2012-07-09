/**
 * Kinvey.Store.Offline test suite.
 */
describe('Kinvey.Store.Offline', function() {
  // Create store.
  before(function() {
    this.store = new Kinvey.Store.Offline(COLLECTION_UNDER_TEST);
  });
  after(function(done) {
    Kinvey.getCurrentUser().destroy(callback(done));
  });

  // Kinvey.Store.Offline#remove
  describe('#remove', function() {
    // Create mock.
    before(function(done) {
      this.object = { _id: 'foo', bar: true };
      this.store.save(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('removes an object and synchronizes.', function(done) {
      this.store.remove(this.object, callback(done, {
        success: function(_, info) {
          info.offline.should.be['true'];
        },
        complete: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Offline#save
  describe('#save', function() {
    before(function() {
      this.object = { _id: 'foo', bar: 'baz' };
    });
    after(function(done) {
      this.store.remove(this.object, callback(done, { success: function() { } }));
    });

    // Test suite.
    it('saves an object and synchronizes.', function(done) {
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function(response, info) {
          response.should.eql(object);
          info.offline.should.be['true'];
        },
        complete: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Offline#synchronize
  describe('#synchronize', function() {
    // Create mock.
    beforeEach(function(done) {
      // Add object to store, and change cached copy to yield a conflict.
      var db = this.db = this.store.db;
      var object = this.object = { _id: 'foo', bar: true };
      this.store.save(object, callback(done, {
        complete: function() {
          object.bar = false;// Update cached copy.
          db.save(object, callback(done));
        },
        success: function() { }
      }));
    });
    afterEach(function(done) {
      // Remove separately, since calling remove would yield a conflict.
      var db = this.db;
      var object = this.object;
      this.store.store.remove(object, callback(done, {
        success: function() {
          db.remove(object, callback(done));
        },
        error: function() {
          // Last test case will throw an error here, but that's OK.
          done();
        }
      }));
    });

    // Test suite.
    it('detects a conflict.', function(done) {
      Kinvey.Sync.application(callback(done, {
        conflict: function(collection, cached, remote, options) {
          collection.should.equal(COLLECTION_UNDER_TEST);
          cached.bar.should.be['false'];
          remote.bar.should.be['true'];

          // Do not change conflicting state.
          options.error();
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].should.eql({
            committed: [],
            conflicted: ['foo'],
            canceled: []
          });
          done();
        }
      }));
    });
    it('resolves a conflict using clientAlwaysWins.', function(done) {
      var store = this.store;
      var object = this.object;
      Kinvey.Sync.application(callback(done, {
        conflict: Kinvey.Sync.clientAlwaysWins,
        success: function(status) {
          status[COLLECTION_UNDER_TEST].should.eql({
            committed: ['foo'],
            conflicted: [],
            canceled: []
          });

          // Make sure client really did win.
          store.query(object._id, callback(done, {
            policy: Kinvey.Store.Cached.NO_CACHE,
            success: function(response) {
              response.bar.should.be['false'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using serverAlwaysWins.', function(done) {
      var store = this.store;
      var object = this.object;
      Kinvey.Sync.application(callback(done, {
        conflict: Kinvey.Sync.serverAlwaysWins,
        success: function(status) {
          status[COLLECTION_UNDER_TEST].should.eql({
            committed: ['foo'],
            conflicted: [],
            canceled: []
          });

          // Make sure server really did win.
          store.query(object._id, callback(done, {
            policy: Kinvey.Store.Cached.NO_CACHE,
            success: function(response) {
              response.bar.should.be['true'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.store;
      var object = this.object;
      Kinvey.Sync.application(callback(done, {
        conflict: function(collection, cached, remote, options) {
          collection.should.equal(COLLECTION_UNDER_TEST);

          // The object to be persisted will be an empty object.
          options.success({});
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].should.eql({
            committed: ['foo'],
            conflicted: [],
            canceled: []
          });

          // Make sure properties are really unset.
          store.query(object._id, callback(done, {
            policy: Kinvey.Store.Cached.NO_CACHE,
            success: function(response) {
              (null == response.bar).should.be['true'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.store;
      var object = this.object;
      Kinvey.Sync.application(callback(done, {
        conflict: function(collection, cached, remote, options) {
          collection.should.equal(COLLECTION_UNDER_TEST);

          // Remove both objects.
          options.success(null);
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].should.eql({
            committed: ['foo'],
            conflicted: [],
            canceled: []
          });

          // Make sure item is really gone.
          store.query(object._id, callback(done, {
            policy: Kinvey.Store.Cached.NO_CACHE,
            success: function() {
              done(new Error('Success callback was invoked.'));
            },
            error: function(error) {
              error.error.should.equal(Kinvey.Error.ENTITY_NOT_FOUND);
              done();
            }
          }));
        }
      }));
    });
  });

});
/**
 * Kinvey.Store.Offline test suite.
 */
describe('Kinvey.Store.Offline', function() {
  before(function() {
    this.store = new Kinvey.Store.Offline(COLLECTION_UNDER_TEST);
    this.cached = this.store.cached;
    this.network = this.store.network;
  });
  after(function(done) {
    var cached = this.cached;
    Kinvey.getCurrentUser().destroy(callback(done, {
      success: function() {
        cached.purge(callback(done));
      }
    }));
  });

  // Kinvey.Store.Offline#remove
  describe('#remove', function() {
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
          status.committed.should.equal(1);
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
          status.committed.should.equal(1);
          done();
        }
      }));
    });
  });

  // Kinvey.Store.Offline#synchronize
  describe('#synchronize', function() {
    beforeEach(function(done) {
      // Add object to store, and change cached copy to yield a conflict.
      var cached = this.cached;
      var object = this.object = { _id: 'foo', bar: true };

      this.store.save(this.object, callback(done, {
        complete: function() {
          object.bar = false;// Update cached copy.
          cached.save(object, callback(done));
        },
        success: function() { }
      }));
    });
    afterEach(function(done) {
      // Remove separately, since calling remove would yield a conflict.
      var cached = this.cached;
      var object = this.object;
      this.network.remove(this.object, callback(done, {
        success: function() {
          cached.remove(object, callback(done));
        },
        error: function() {
          // Last test case will throw an error here, but that's OK.
          done();
        }
      }));
    });

    // Test suite.
    it('detects a conflict.', function(done) {
      // Update remote. Use case: two devices updated the same data.
      this.store.configure({ conflict: function(cached, remote, options) {
        cached.bar.should.be['false'];
        remote.bar.should.be['true'];

        // Do not change conflicting state.
        options.error();
      } });
      this.store.synchronize(callback(done, {
        success: function(status) {
          status.conflicted.should.equal(1);
          done();
        }
      }));
    });
    it('resolves a conflict using clientAlwaysWins.', function(done) {
      var store = this.store;
      var object = this.object;
      store.configure({
        conflict: Kinvey.Store.Offline.clientAlwaysWins,
        policy: Kinvey.Store.Cached.BOTH
      });
      store.synchronize(callback(done, {
        success: function(status) {
          status.committed.should.equal(1);

          // Make sure client really did win.
          store.query(object._id, callback(done, {
            success: function(response) {
              response.bar.should.be['false'];
            }
          }));
        }
      }));
    });
    it('resolves a conflict using serverAlwaysWins.', function(done) {
      var store = this.store;
      var object = this.object;
      store.configure({
        conflict: Kinvey.Store.Offline.serverAlwaysWins,
        policy: Kinvey.Store.Cached.BOTH
      });
      store.synchronize(callback(done, {
        success: function(status) {
          status.committed.should.equal(1);

          // Make sure server really did win.
          store.query(object._id, callback(done, {
            success: function(response) {
              response.bar.should.be['true'];
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.store;
      var object = this.object;
      store.configure({
        conflict: function(_, __, options) {
          // The object to be persisted will be an empty object.
          options.success({});
        },
        policy: Kinvey.Store.Cached.BOTH
      });
      store.synchronize(callback(done, {
        success: function(status) {
          status.committed.should.equal(1);

          // Make sure item is really gone.
          store.query(object._id, callback(done, {
            success: function(response) {
              (null == response.bar).should.be['true'];
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.store;
      var object = this.object;
      store.configure({
        conflict: function(_, __, options) {
          // Remove both objects.
          options.success(null);
        },
        policy: Kinvey.Store.Cached.BOTH
      });
      store.synchronize(callback(done, {
        success: function(status) {
          status.committed.should.equal(1);

          // Make sure item is really gone.
          store.query(object._id, callback(done, {
            success: function() {
              done(new Error('Success callback was invoked.'));
            },
            error: function() { }
          }));
        }
      }));
    });
  });

});
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
  /*
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
      this.appdata.remove(object, callback(done, {
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
      Kinvey.Store.Sync.synchronize(callback(done, {
        conflict: function(cached, remote, options) {
          cached.bar.should.be['false'];
          remote.bar.should.be['true'];
  
          // Do not change conflicting state.
          options.error();
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].conflicted.should.have.length(1);
          done();
        }
      }));
    });
    it('resolves a conflict using clientAlwaysWins.', function(done) {
      var store = this.appdata;
      var object = this.object;
      Kinvey.Store.Sync.synchronize(callback(done, {
        conflict: Kinvey.Store.Sync.clientAlwaysWins,
        success: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);

          // Make sure client really did win.
          store.query(object._id, callback(done, {
            success: function(response) {
              response.bar.should.be['false'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using serverAlwaysWins.', function(done) {
      var store = this.appdata;
      var object = this.object;
      Kinvey.Store.Sync.synchronize(callback(done, {
        conflict: Kinvey.Store.Sync.serverAlwaysWins,
        success: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);

          // Make sure server really did win.
          store.query(object._id, callback(done, {
            success: function(response) {
              response.bar.should.be['true'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.appdata;
      var object = this.object;
      Kinvey.Store.Sync.synchronize(callback(done, {
        conflict: function(_, __, options) {
          // The object to be persisted will be an empty object.
          options.success({});
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);

          // Make sure item is really gone.
          store.query(object._id, callback(done, {
            success: function(response) {
              (null == response.bar).should.be['true'];
              done();
            }
          }));
        }
      }));
    });
    it('resolves a conflict using a custom handler.', function(done) {
      var store = this.appdata;
      var object = this.object;
      Kinvey.Store.Sync.synchronize(callback(done, {
        conflict: function(_, __, options) {
          // Remove both objects.
          options.success(null);
        },
        success: function(status) {
          status[COLLECTION_UNDER_TEST].committed.should.have.length(1);

          // Make sure item is really gone.
          store.query(object._id, callback(done, {
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
*/
});
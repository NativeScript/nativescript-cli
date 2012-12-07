/**
 * Kinvey.Sync test suite.
 */
describe('Kinvey.Sync', function() {
  // Housekeeping.
  before(function() {
    this.store = Kinvey.Store.factory(Kinvey.Store.OFFLINE, COLLECTION_UNDER_TEST);
    this.appdata = this.store.appdata;
    this.db = this.store.db;
  });

  // Reset application state.
  beforeEach(function(done) {
    // Changing the state might trigger synchronization.
    Kinvey.Sync.configure(callback(done));
    Kinvey.Sync.isOnline ? done() : Kinvey.Sync.online();
  });

  // Kinvey.Sync#offline
  describe('.offline', function() {
    // Test suite.
    it('sets the application state to offline.', function() {
      Kinvey.Sync.offline();
      Kinvey.Sync.isOnline.should.be['false'];
    });
    it('blocks all synchronization operations.', function(done) {
      Kinvey.Sync.offline();
      Kinvey.Sync.application({
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(error) {
          error.error.should.equal(Kinvey.Error.NO_NETWORK);
          done();
        }
      });
    });
  });

  // Kinvey.Sync#online
  describe('.online', function() {
    // Test suite.
    it('triggers synchronization when coming back online.', function(done) {
      // Define synchronization callbacks.
      Kinvey.Sync.configure(callback(done, {
        success: function(status) {
          status.should.eql({});
          done();
        }
      }));

      // Switch state.
      Kinvey.Sync.offline();
      Kinvey.Sync.online();
      Kinvey.Sync.isOnline.should.be['true'];
    });
  });

  // Kinvey.Sync#application
  describe('.application', function() {
    // Housekeeping.
    beforeEach(function() {
      Kinvey.Sync.offline();
    });
    afterEach(function(done) {
      var store = this.store;
      store.remove({ _id: 'foo' }, callback(done, {
        success: function() { },
        complete: function() {
          store.remove({ _id: 'bar' }, callback(done, { success: function() { } }));
        }
      }));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('synchronizes the entire application.', function(done) {
      var pending = 0;
      var handler = function() {
        pending += 1;
        return callback(done, {
          success: function() { },
          complete: function() {
            if(!--pending) {
              // Set callbacks.
              var started = false;
              Kinvey.Sync.configure(callback(done, {
                start: function() {
                  started = true;// Switch flag.
                },
                success: function(status) {
                  started.should.be['true'];
                  status[COLLECTION_UNDER_TEST].committed.should.have.length(2);
                  done();
                }
              }));
              
              // Trigger synchronization.
              Kinvey.Sync.online();
            }
          }
        });
      };

      // Define a set of operations.
      this.store.save({ _id: 'foo' }, handler());
      this.store.remove({ _id: 'bar' }, handler());
    });
  });

  // Kinvey.Sync#collection
  describe('.collection', function() {
    // Housekeeping.
    beforeEach(function() {
      this.object = { _id: 'foo', bar: 'baz' };
      this.remove = { _id: 'qux' };
    });
    afterEach(function(done) {
      this.store.remove(this.object, callback(done, { success: function() { } }));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('synchronizes a specific collection.', function(done) {
      var db = this.db;
      var remove = this.remove;

      // Save locally.
      db.save(this.object, callback(done, {
        success: function() {
          // Remove locally.
          db.remove(remove, callback(done, {
            success: function() {
              // Synchronize.
              Kinvey.Sync.collection(COLLECTION_UNDER_TEST, callback(done, {
                success: function(status) {
                  status[COLLECTION_UNDER_TEST].committed.should.have.length(2);
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
  });

  // Kinvey.Sync#object
  describe('.object', function() {
    // Housekeeping.
    beforeEach(function() {
      this.object = { _id: 'foo', bar: 'baz' };
    });
    afterEach(function(done) {
      // The store doesn't care if the object exists.
      this.store.remove(this.object, callback(done, {
        conflict: Kinvey.Sync.clientAlwaysWins,
        success: function() { }
      }));
    });
    after(function(done) {
      Kinvey.getCurrentUser().destroy(callback(done));
    });

    // Test suite.
    it('creates an object.', function(done) {
      // Save locally.
      this.db.save(this.object, callback(done, {
        success: function(object) {
          // Synchronize.
          Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
            success: function(status) {
              status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
              done();
            }
          }));
        }
      }));
    });
    it('updates an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function() { },
        complete: function() {
          // Update locally.
          object.bar = 'qux';
          db.save(object, callback(done, {
            success: function() {
              Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                success: function(status) {
                  status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('yields a conflict on updating an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function() { },
        complete: function() {
          // Alter object locally.
          object.bar = 'qux';
          object._kmd = { lmt: null };// Corrupt timestamp.

          // Save locally.
          db.save(object, callback(done, {
            success: function() {
              // Synchronize. We expect a conflict to occur.
              Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                conflict: function(collection, cached, remote, options) {
                  collection.should.equal(COLLECTION_UNDER_TEST);
                  cached.bar.should.equal('qux');
                  remote.bar.should.equal('baz');

                  // Maintain conflict.
                  options.error();
                },
                success: function(status) {
                  status[COLLECTION_UNDER_TEST].conflicted.should.have.length(1);
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('yields and resolves a conflict on updating an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function() { },
        complete: function() {
          // Alter object locally.
          object.bar = 'qux';
          object._kmd = { lmt: null };// Corrupt timestamp.

          // Save locally.
          db.save(object, callback(done, {
            success: function() {
              // Synchronize. We expect a conflict to occur.
              Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                conflict: function(collection, cached, remote, options) {
                  collection.should.equal(COLLECTION_UNDER_TEST);
                  cached.bar.should.equal('qux');
                  remote.bar.should.equal('baz');

                  // Client wins.
                  Kinvey.Sync.clientAlwaysWins(collection, cached, remote, options);
                },
                success: function(status) {
                  status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('deletes an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(this.object, callback(done, {
        success: function() { },
        complete: function() {
          // Delete locally.
          db.remove(object, callback(done, {
            success: function() {
              // Synchronize.
              Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                success: function(status) {
                  status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
                  done();
                }
              }));
            }
          }));
        }
      }));
    });
    it('yields a conflict on deleting an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function() { },
        complete: function() {
          // Alter object locally.
          object._kmd = { lmt: null };// Corrupt timestamp.

          // Delete locally.
          db.save(object, callback(done, {
            success: function() {
              db.remove(object, callback(done, {
                success: function() {
                  // Synchronize. We expect a conflict to occur.
                  Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                    conflict: function(collection, cached, remote, options) {
                      collection.should.equal(COLLECTION_UNDER_TEST);
                      (null === cached).should.be['true'];
                      remote.bar.should.equal('baz');

                      // Maintain conflict.
                      options.error();
                    },
                    success: function(status) {
                      status[COLLECTION_UNDER_TEST].conflicted.should.have.length(1);
                      done();
                    }
                  }));
                }
              }));
            }
          }));
        }
      }));
    });
    it('yields and resolves a conflict on deleting an object.', function(done) {
      // Save.
      var db = this.db;
      var object = this.object;
      this.store.save(object, callback(done, {
        success: function() { },
        complete: function() {
          // Alter object locally.
          object._kmd = { lmt: null };// Corrupt timestamp.

          // Delete locally.
          db.save(object, callback(done, {
            success: function() {
              db.remove(object, callback(done, {
                success: function() {
                  // Synchronize. We expect a conflict to occur.
                  Kinvey.Sync.object(COLLECTION_UNDER_TEST, object, callback(done, {
                    conflict: function(collection, cached, remote, options) {
                      collection.should.equal(COLLECTION_UNDER_TEST);
                      (null === cached).should.be['true'];
                      remote.bar.should.equal('baz');

                      // Client wins.
                      Kinvey.Sync.clientAlwaysWins(collection, cached, remote, options);
                    },
                    success: function(status) {
                      status[COLLECTION_UNDER_TEST].committed.should.have.length(1);
                      done();
                    }
                  }));
                }
              }));
            }
          }));
        }
      }));
    });
  });

  // Kinvey.Sync#syncWith
  describe('.syncWith', function() {
    // Housekeeping: work in offline mode.
    before(function(done) {
      var self = this;
      this.password = 'secret';
      Kinvey.User.create({ password: this.password }, callback(done, {
        success: function(user) {
          self.username = user.getUsername();
          Kinvey.getCurrentUser().logout(callback(done));
        }
      }));
    })
    beforeEach(function() {
      Kinvey.Sync.offline();
    });
    after(function(done) {
      var user = new Kinvey.User();
      user.login(this.username, this.password, callback(done, {
        success: function(user) {
          user.destroy(callback(done));
        }
      }));
    });

    // Test suite.
    it('synchronizes with a specific user context.', function(done) {
      var username = this.username;
      Kinvey.Sync.syncWith(username, this.password);
      Kinvey.Sync.configure(callback(done, {
        success: function() {
          Kinvey.getCurrentUser().getUsername().should.equal(username);
          Kinvey.Sync.isOnline.should.be['true'];
          done();
        }
      }));
      Kinvey.Sync.online();
    });
    it('throws an error when synchronizing with invalid user context.', function(done) {
      Kinvey.Sync.syncWith('username', 'password');// Non-existent user.
      Kinvey.Sync.configure(callback(done, {
        success: function() {
          done(new Error('Success callback was invoked.'));
        },
        error: function(error, info) {
          error.error.should.equal(Kinvey.Error.INVALID_CREDENTIALS);
          (null === Kinvey.getCurrentUser()).should.be['true'];
          Kinvey.Sync.isOnline.should.be['true'];
          done();
        }
      }));
      Kinvey.Sync.online();
    });
  });
});
/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Obtain a reference to the top-level describe method.
var globalDescribe = describe;

/**
 * Test suite for `Kinvey.Sync`.
 */
describe('Kinvey.Sync', function() {

  // If there is no adapter, skip the test suite.
  var describe = (function() {
    try {
      Kinvey.Persistence.Local.read({ id: '_count' });
      return globalDescribe;
    }
    catch(e) {
      return globalDescribe.skip;
    }
  }());

  // Housekeeping: manage the current user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Restore.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: enable sync.
  before(function() {
    return Kinvey.Sync.init({ enable: true });
  });
  after(function() {// Restore.
    return Kinvey.Sync.init({ enable: false });
  });

  // Kinvey.Sync.count.
  describe('the count method', function() {
    // Documents pending synchronization.
    describe('with documents pending synchronization', function() {
      // Housekeeping: create a document pending synchronization.
      before(function() {
        var _this = this;
        return Kinvey.DataStore.save(this.collection, {}, { offline: true }).then(function(doc) {
          _this.doc = doc;
        });
      });
      after(function() {// Delete the created document.
        return Kinvey.DataStore.destroy(this.collection, this.doc._id, { offline: true });
      });
      after(function() {// Cleanup.
        delete this.doc;
      });

      // Housekeeping: make sure no synchronization metadata is kept back.
      after(function() {
        return Kinvey.Sync.execute();
      });

      // Test suite.
      it('should return 1.', function() {
        var promise = Kinvey.Sync.count();
        return expect(promise).to.become(1);
      });
      it('should return 1 for a specific collection.', function() {
        var promise = Kinvey.Sync.count(this.collection);
        return expect(promise).to.become(1);
      });
      it('should return 0 for a nonexisting collection.', function() {
        var promise = Kinvey.Sync.count(this.randomID());
        return expect(promise).to.become(0);
      });
    });

    // No documents pending synchronization.
    describe('with no documents pending synchronization', function() {
      // Test suite.
      it('should return 0.', function() {
        var promise = Kinvey.Sync.count();
        return expect(promise).to.become(0);
      });
      it('should return 0 for a specific collection.', function() {
        var promise = Kinvey.Sync.count(this.collection);
        return expect(promise).to.become(0);
      });
      it('should return 0 for a nonexisting collection.', function() {
        var promise = Kinvey.Sync.count(this.randomID());
        return expect(promise).to.become(0);
      });
    });
  });

  // Kinvey.Sync.destruct.
  describe('the destruct method.', function() {
    // Housekeeping: create a document locally.
    beforeEach(function() {
      return Kinvey.DataStore.save(this.collection, {}, { offline: true });
    });
    // The document will be deleted by the tests.

    // Test suite.
    it('should destruct the local database.', function() {
      var _this   = this;
      var promise = Kinvey.Sync.destruct();
      return promise.then(function() {
        var promise = Kinvey.Sync.count(_this.collection);
        return expect(promise).to.become(0);
      });
    });
  });

  // Kinvey.Sync.execute.
  describe('the execute method', function() {

    // With user context.
    describe('with user context', function() {
      // Housekeeping: manage the active user.
      before(function() {
        Kinvey.setActiveUser(null);
      });
      after(function() {
        Kinvey.setActiveUser(this.user);
      });

      // Housekeeping: spy on login.
      before(function() {
        sinon.spy(Kinvey.User, 'login');
      });
      afterEach(function() {// Reset.
        Kinvey.User.login.reset();
      });
      after(function() {// Restore.
        Kinvey.User.login.restore();
      });

      // Test suite.
      it('should login prior to initiating synchronization.', function() {
        var user = {// Invalid credentials, but that’s OK.
          username: this.randomID(),
          password: this.randomID()
        };
        var promise = Kinvey.Sync.execute({ user: user });
        return promise.then(function() {
          // We should not reach this code branch.
          return expect(promise).to.be.rejected;
        }, function() {
          expect(Kinvey.User.login).to.be.calledOnce;
          expect(Kinvey.User.login).to.be.calledWith(user);
        });
      });
      it('should support both deferreds and callbacks on success.', Common.success(function(options) {
        return Kinvey.Sync.execute(options);
      }));
      it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
        options.user = {// Invalid credentials, but that’s OK.
          username: this.randomID(),
          password: this.randomID()
        };
        return Kinvey.Sync.execute(options);
      }));
    });

    // No documents pending synchronization.
    describe('with no documents pending synchronization', function() {
      // Test suite.
      it('should return immediately.', function() {
        var promise = Kinvey.Sync.execute();
        return expect(promise).to.become([]);
      });
    });

    // Documents pending synchronization.
    describe('with documents pending synchronization', function() {

      // Without conflicts.
      describe('without conflicts', function() {
        // Housekeeping: create a document.
        beforeEach(function() {
          var _this = this;
          return Kinvey.DataStore.save(this.collection, {}, { offline: true }).then(function(doc) {
            _this.doc = doc;
          });
        });
        afterEach(function() {// Delete the created document.
          return Kinvey.DataStore.destroy(this.collection, this.doc._id, { refresh: true });
        });
        afterEach(function() {// Cleanup.
          delete this.doc;
        });

        // Test suite.
        it('should synchronize a document.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute();
          return promise.then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);

            // Inspect body.
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(_this.collection);
            expect(response[0].success).to.deep.equal([ _this.doc._id ]);
            expect(response[0].error).to.be.empty;
          });
        });
        it('should save the document remotely.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute().then(function() {
            return Kinvey.DataStore.get(_this.collection, _this.doc._id);
          });
          return promise.then(function(doc) {
            expect(doc).to.have.property('_id', _this.doc._id);
            expect(doc).to.have.deep.property('_kmd.lmt');
          });
        });
        it('should update the document locally.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute().then(function() {
            return Kinvey.DataStore.get(_this.collection, _this.doc._id, { offline: true });
          });
          return promise.then(function(doc) {
            expect(doc).to.have.property('_id', _this.doc._id);
            expect(doc).to.have.deep.property('_kmd.lmt');
          });
        });
      });

      // With conflicts.
      describe('with conflicts', function() {
        // Housekeeping: create a conflicting document.
        beforeEach(function() {
          this.doc = { _id: this.randomID(), field: this.randomID() };
        });
        beforeEach(function() {// Save the document on local.
          return Kinvey.DataStore.save(this.collection, this.doc, { offline: true });
        });
        beforeEach(function() {// Save the document on net, but do not update local.
          return Kinvey.DataStore.save(this.collection, this.doc, { refresh: false });
        });
        afterEach(function() {// Delete the document on local (if not already done by sync).
          return Kinvey.DataStore.destroy(this.collection, this.doc._id, {
            silent  : true,
            offline : true
          });
        });
        afterEach(function() {// Delete the document on net (if not already done by sync).
          return Kinvey.DataStore.destroy(this.collection, this.doc._id, { silent: true });
        });
        afterEach(function() {// Cleanup.
          delete this.doc;
        });

        // Housekeeping: make sure no synchronization metadata is kept back.
        afterEach(function() {
          return Kinvey.Sync.execute();
        });

        // Test suite.
        it('should not synchronize the document.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute();
          return promise.then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);

            // Inspect body.
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(_this.collection);
            expect(response[0].success).to.be.empty;
            expect(response[0].error).to.deep.equal([ _this.doc._id ]);
          });
        });
        it('should not save the document remotely.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute().then(function() {
            return Kinvey.DataStore.get(_this.collection, _this.doc._id);
          });
          return promise.then(function(doc) {
            expect(doc).to.have.property('_id', _this.doc._id);
            expect(doc).to.have.deep.property('_kmd.lmt');
          });
        });
        it('should not update the document locally.', function() {
          var _this   = this;
          var promise = Kinvey.Sync.execute().then(function() {
            return Kinvey.DataStore.get(_this.collection, _this.doc._id, { offline: true });
          });
          return promise.then(function(doc) {
            expect(doc).to.have.property('_id', _this.doc._id);
            expect(doc).not.to.have.deep.property('_kmd.lmt');
          });
        });
        it('should synchronize (delete) the document if `options.conflict`.', function() {
          var handler = function() {
            return Kinvey.Defer.resolve(null);
          };

          var _this   = this;
          var promise = Kinvey.Sync.execute({ conflict: handler }).then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);

            // Inspect body.
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(_this.collection);
            expect(response[0].success).to.deep.equal([ _this.doc._id ]);
            expect(response[0].error).to.be.empty;

            // The document should not exist any more.
            return Kinvey.DataStore.get(_this.collection, _this.doc._id, { offline: true });
          });
          return promise.then(function() {
            // We should not reach this code branch.
            return expect(promise).to.be.rejected;
          }, function(error) {
            expect(error).to.have.property('name', Kinvey.Error.ENTITY_NOT_FOUND);
          });
        });
        it('should synchronize (update) the document if `options.conflict`.', function() {
          var value   = this.randomID();
          var handler = function(collection, local) {
            local.field = value;
            return Kinvey.Defer.resolve(local);
          };

          var _this   = this;
          var promise = Kinvey.Sync.execute({ conflict: handler }).then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);

            // Inspect body.
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(_this.collection);
            expect(response[0].success).to.deep.equal([ _this.doc._id ]);
            expect(response[0].error).to.be.empty;

            // The document should be the same for local and net.
            return Kinvey.Defer.all([
              Kinvey.DataStore.get(_this.collection, _this.doc._id, { offline: true }),
              Kinvey.DataStore.get(_this.collection, _this.doc._id)
            ]);
          });
          return promise.then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(2);
            expect(response[0]).to.deep.equal(response[1]);
            expect(response[0]).to.have.property('field', value);
          });
        });
        it('should not synchronize the document if `options.conflict` rejects.', function() {
          var handler = function() {
            return Kinvey.Defer.reject();
          };

          var _this   = this;
          var promise = Kinvey.Sync.execute({ conflict: handler });
          return promise.then(function(response) {
            expect(response).to.be.an('array');
            expect(response).to.have.length(1);

            // Inspect body.
            expect(response[0]).to.contain.keys(['collection', 'success', 'error']);
            expect(response[0].collection).to.equal(_this.collection);
            expect(response[0].success).to.be.empty;
            expect(response[0].error).to.deep.equal([ _this.doc._id ]);
          });
        });
      });

    });

  });

  // Kinvey.Sync.isEnabled.
  describe('the isEnabled method', function() {
    // Housekeeping: mark application as enabled.
    afterEach(function() {
      return Kinvey.Sync.init({ enable: true});
    });

    // Test suite.
    it('should return true if enabled.', function() {
      expect(Kinvey.Sync.isEnabled()).to.be['true'];
    });
    it('should return false if disabled.', function() {
      var promise = Kinvey.Sync.init({ enable: false });
      return promise.then(function() {
        expect(Kinvey.Sync.isEnabled()).to.be['false'];
      });
    });
  });

  // Kinvey.Sync.isOnline.
  describe('the isOnline method', function() {
    // Housekeeping: mark application as online.
    afterEach(function() {
      return Kinvey.Sync.online({ sync: false });
    });

    // Test suite.
    it('should return true if online.', function() {
      expect(Kinvey.Sync.isOnline()).to.be['true'];
    });
    it('should return false if offline.', function() {
      var promise = Kinvey.Sync.offline();
      return promise.then(function() {
        expect(Kinvey.Sync.isOnline()).to.be['false'];
      });
    });
  });

  // Kinvey.Sync.offline.
  describe('the offline method', function() {
    // Housekeeping: mark application as online.
    afterEach(function() {
      return Kinvey.Sync.online({ sync: false });
    });

    // Test suite.
    it('should set the application state to offline.', function() {
      var promise = Kinvey.Sync.offline();
      return promise.then(function() {
        expect(Kinvey.Sync.isOnline()).to.be['false'];
      });
    });
  });

  // Kinvey.Sync.online.
  describe('the online method', function() {
    // Housekeeping: mark application as offline.
    beforeEach(function() {
      return Kinvey.Sync.offline();
    });
    afterEach(function() {// Restore.
      return Kinvey.Sync.online({ sync: false });
    });

    // Housekeeping: stub the synchronization operation.
    before(function() {
      sinon.stub(Kinvey.Sync, 'execute', Kinvey.Defer.resolve);
    });
    afterEach(function() {// Reset.
      Kinvey.Sync.execute.reset();
    });
    after(function() {// Restore.
      Kinvey.Sync.execute.restore();
    });

    // Test suite.
    it('should set the application state to online.', function() {
      var promise = Kinvey.Sync.online({ sync: false });
      return promise.then(function() {
        expect(Kinvey.Sync.isOnline()).to.be['true'];
      });
    });
    it('should initiate a synchronization operation.', function() {
      var promise = Kinvey.Sync.online();
      return promise.then(function() {
        expect(Kinvey.Sync.execute).to.be.calledOnce;
      });
    });
    it('should not initiate a synchronization operation if not `options.sync`.', function() {
      var promise = Kinvey.Sync.online({ sync: false });
      return promise.then(function() {
        expect(Kinvey.Sync.execute).not.to.be.called;
      });
    });
    it('should not initiate a synchronization operation if already online.', function() {
      var promise = Kinvey.Sync.online({ sync: false });
      return promise.then(function() {
        return Kinvey.Sync.online().then(function() {
          expect(Kinvey.Sync.execute).not.to.be.called;
        });
      });
    });
  });

});
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
 * The Kinvey.Backbone.User test suite.
 */
describe('Kinvey.Backbone.User', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: create a model.
  beforeEach(function() {
    this.model = new Kinvey.Backbone.User();
  });
  afterEach(function() {// Cleanup.
    delete this.model;
  });

  // Kinvey.Backbone.Model.
  describe('the constructor', function() {
    // Test suite.
    it('should create a new model.', function() {
      var model = new Kinvey.Backbone.User();
      expect(model).to.be.an.instanceOf(Kinvey.Backbone.User);
      expect(model).not.to.be.an.instanceOf(Kinvey.Backbone.Model);
      expect(model).to.be.an.instanceOf(Backbone.Model);
    });
  });

  // Kinvey.Backbone.User.idAttribute.
  describe('the idAttribute property', function() {
    // Test suite.
    it('should equal `_id`.', function() {
      expect(this.model.idAttribute).to.equal('_id');
    });
  });

  // Kinvey.Backbone.User.sync.
  describe('the sync property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.Sync.', function() {
      expect(this.model.sync.toString()).to.contain('Kinvey.Backbone.Sync');
    });
  });

  // Kinvey.Backbone.User.isLoggedIn.
  describe('the isLoggedIn method', function() {
    describe('when logged in', function() {
      // Housekeeping: manage the active user.
      beforeEach(function() {
        Kinvey.setActiveUser(this.user);
        this.model.set(this.user);
      });
      afterEach(function() {// Reset.
        Kinvey.setActiveUser(null);
      });

      // Test suite.
      it('should return true.', function() {
        expect(this.model.isLoggedIn()).to.be['true'];
      });
    });
    describe('when not logged in', function() {
      // Test suite.
      it('should return false.', function() {
        expect(this.model.isLoggedIn()).to.be['false'];
      });
    });
  });

  // Kinvey.Backbone.User.login.
  describe('the login method', function() {
    // Housekeeping: create a new user.
    before(function() {
      var _this = this;
      return Kinvey.User.create({}, { state: false }).then(function(response) {
        _this.data = response;
      });
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });
    after(function() {// Delete the user using its credentials.
      Kinvey.setActiveUser(this.data);
      return Kinvey.User.destroy(this.data._id, { hard: true }).then(function() {
        Kinvey.setActiveUser(null);// Reset.
      });
    });
    after(function() {// Cleanup.
      delete this.data;
    });

    // Test suite.
    it('should login the user.', function() {
      var _this   = this;
      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(_this.model.isLoggedIn()).to.be['true'];
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username', _this.data.username);
        expect(args[0]).not.to.have.property('password');
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should parse the response if the `parse` flag was set.', function() {
      this.model.parse = sinon.spy();

      var _this   = this;
      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(_this.model.parse).to.be.calledOnce;
      });
    });
    it('should trigger a change event.', function() {
      var spy = sinon.spy();
      this.model.on('change', spy);

      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this   = this;
      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function(value) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(value[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger an error event.', function() {
      var spy = sinon.spy();
      this.model.on('error', spy);

      var _this   = this;
      var data    = { username: this.randomID(), password: this.randomID() };
      var promise = this.jQueryToKinveyPromise(this.model.login(data));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(reason) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(reason[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.model.login(this.data.username, this.data.password);
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy     = sinon.spy();

      var _this   = this;
      var promise = this.model.login(this.data.username, this.data.password, { success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.login(this.randomID(), this.randomID(), { error: spy });
      promise = this.jQueryToKinveyPromise(promise);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.User.logout.
  describe('the logout method', function() {
    // Housekeeping: create test user.
    before(function() {
      var _this = this;
      return Kinvey.User.create({}, { state: false }).then(function(user) {
        _this.data = user;
      });
    });
    beforeEach(function() {// Login the created user.
      return Kinvey.User.login(this.data.username, this.data.password);
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });
    after(function() {// Delete the user using its credentials.
      return Kinvey.User.login(this.data.username, this.data.password).then(function(user) {
        return Kinvey.User.destroy(user._id, { hard: true }).then(function() {
          Kinvey.setActiveUser(null);// Reset.
        });
      });
    });
    after(function() {// Cleanup.
      delete this.data;
    });

    // Housekeeping: mark the user as logged in.
    beforeEach(function() {
      this.model.set(Kinvey.getActiveUser());
    });

    // Test suite.
    it('should logout the user.', function() {
      var _this = this;
      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(_this.model.isLoggedIn()).to.be['false'];
        expect(_this.model.get('_kmd')).not.to.have.property('authtoken');

        // Inspect arguments.
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should fail when the user is not logged in.', function() {
      Kinvey.setActiveUser(null);// Force failure.

      var promise = this.jQueryToKinveyPromise(this.model.logout());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be['null'];// statusText.
        expect(args[1]).to.be['null'];// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.NOT_LOGGED_IN);
      });
    });
    it('should parse the response if the `parse` flag was set.', function() {
      this.model.parse = sinon.spy();

      var _this   = this;
      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(_this.model.parse).to.be.calledOnce;
      });
    });
    it('should trigger a change event.', function() {
      // The request should not change the user data. To still force the change
      // event, corrupt the username.
      this.model.set('username', this.randomID());

      var spy = sinon.spy();
      this.model.on('change', spy);

      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this   = this;
      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function(value) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.deep.equal(value[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger an error event.', function() {
      Kinvey.setActiveUser(null);// Force failure.

      var spy = sinon.spy();
      this.model.on('error', spy);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.logout());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(reason) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(reason[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.model.logout();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username');// The response.
        expect(args[0]).not.to.have.deep.property('_kmd.authtoken');
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy     = sinon.spy();

      var _this   = this;
      var promise = this.model.logout({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.setActiveUser(null);// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.logout({ error: spy });
      promise = this.jQueryToKinveyPromise(promise);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.User.me.
  describe('the me method', function() {
    // Housekeeping: manage the active user.
    beforeEach(function() {
      Kinvey.setActiveUser(this.user);
      this.model.set(this.user);
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Test suite.
    it('should return the active user.', function() {
      var _this   = this;
      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(_this.model.isLoggedIn()).to.be['true'];
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username', _this.user.username);
        expect(args[0]).not.to.have.property('password');
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should fail when the user is not logged in.', function() {
      Kinvey.setActiveUser(null);// Force failure.

      var promise = this.jQueryToKinveyPromise(this.model.me());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be['null'];// statusText.
        expect(args[1]).to.be['null'];// jQuery xhr.
        expect(args[2]).to.have.property('name', Kinvey.Error.NOT_LOGGED_IN);
      });
    });
    it('should parse the response if the `parse` flag was set.', function() {
      this.model.parse = sinon.spy();

      var _this   = this;
      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(_this.model.parse).to.be.calledOnce;
      });
    });
    it('should trigger a change event.', function() {
      // The request should not change the user data. To still force the change
      // event, corrupt the username.
      this.model.set('username', this.randomID());

      var spy = sinon.spy();
      this.model.on('change', spy);

      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.model.on('request', spy);

      var _this   = this;
      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger a sync event.', function() {
      var spy = sinon.spy();
      this.model.on('sync', spy);

      var _this   = this;
      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function(value) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.deep.equal(value[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should trigger an error event.', function() {
      Kinvey.setActiveUser(null);// Force failure.

      var spy = sinon.spy();
      this.model.on('error', spy);

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.me());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(reason) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(reason[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.model.me();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.have.property('username');// The response.
        expect(args[0]).to.have.deep.property('_kmd.authtoken');
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy     = sinon.spy();

      var _this   = this;
      var promise = this.model.me({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.setActiveUser(null);// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.model.me({ error: spy });
      promise = this.jQueryToKinveyPromise(promise);
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.model);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });


  // Kinvey.Backbone.User.save.
  describe('the save method', function() {
    // Housekeeping: delete the created user (if any).
    afterEach(function() {
      var user = Kinvey.getActiveUser();
      if(null !== user) {
        return Kinvey.User.destroy(user._id, { hard: true }).then(function() {
          Kinvey.setActiveUser(null);// Reset.
        });
      }
    });

    // Test suite.
    it('should create a new user.', function() {
      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function(response) {
        expect(response).to.have.length(3);// data, textStatus, xhr.

        expect(response[0]).to.contain.keys(['_acl', '_id', '_kmd', 'username', 'password']);
        expect(response[1]).to.exist;
        expect(response[2]).to.exist;
        expect(response[2]).to.have.property('responseText');// xhr.

        // Inspect the model.
        expect(_this.model.attributes).to.deep.equal(response[0]);
      });
    });
    it('should login the created user.', function() {
      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.model.save());
      return promise.then(function() {
        expect(Kinvey.getActiveUser()).to.deep.equal(_this.model.attributes);
      });
    });
    it('should not login the created user if the `state` flag was `false`.', function() {
      var promise = this.jQueryToKinveyPromise(this.model.save({}, { state: false }));
      return promise.then(function(response) {
        expect(Kinvey.getActiveUser()).to.be['null'];

        // User should be destroyed after test, so mark as the active user.
        Kinvey.setActiveUser(response[0]);
      });
    });
  });

  // Kinvey.Backbone.User.destroy.
  describe('the destroy method', function() {
    // Housekeeping: manage the active user.
    beforeEach(function() {
      Kinvey.setActiveUser(this.user);
    });
    afterEach(function() {
      Kinvey.setActiveUser(null);
    });

    // Housekeeping: create another user.
    beforeEach(function() {
      this.model.set({ _acl: { gr: true, gw: true } });
      return this.jQueryToKinveyPromise(this.model.save({}, { state: false }));
    });
    afterEach(function() {// Delete the user using the Master Secret.
      // Failure is OK, since the test may have deleted the user already.
      Kinvey.masterSecret = config.test.masterSecret;
      return Kinvey.User.destroy(this.model.id, { hard: true, silent: true }).then(function() {
        Kinvey.masterSecret = null;// Reset.
      });
    });

    // Test suite.
    it('should permanently delete a user if the `hard` flag was set.', function() {
      var _this = this;
      var promise = this.jQueryToKinveyPromise(this.model.destroy({ hard: true })).then(function(response) {
        expect(response[0]).to.be['null'];

        // Try and restore the user.
        Kinvey.masterSecret = config.test.masterSecret;
        return Kinvey.User.restore(_this.model.id);
      });
      return expect(promise).to.be.rejected;
    });
  });
});

/**
 * The Kinvey.Backbone.UserCollection test suite.
 */
describe('Kinvey.Backbone.UserCollection', function() {

  // If this is not the right shim, skip the test suite.
  var describe = Kinvey.Backbone ? globalDescribe : globalDescribe.skip;

  // Housekeeping: manage the active user.
  before(function() {
    Kinvey.setActiveUser(this.user);
  });
  after(function() {// Reset.
    Kinvey.setActiveUser(null);
  });

  // Housekeeping: create a collection.
  beforeEach(function() {
    this.col = new Kinvey.Backbone.UserCollection();
  });
  afterEach(function() {// Cleanup.
    delete this.col;
  });

  // Kinvey.Backbone.UserCollection.
  describe('the constructor', function() {
    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      var _this = this;
      expect(function() {
        _this.col = new Kinvey.Backbone.UserCollection([], { query: {} });
      }).to.Throw('Kinvey.Query');
    });
    it('should create a new collection.', function() {
      var collection = new Kinvey.Backbone.UserCollection();
      expect(collection).to.be.an.instanceOf(Kinvey.Backbone.UserCollection);
      expect(collection).not.to.be.an.instanceOf(Kinvey.Backbone.Collection);
      expect(collection).to.be.an.instanceOf(Backbone.Collection);
    });
    it('should set the query if `options.query` was set.', function() {
      var query = new Kinvey.Query();
      var collection = new Kinvey.Backbone.UserCollection([], { query: query });
      expect(collection.query).to.equal(query);
    });
  });

  // Kinvey.Backbone.UserCollection.model.
  describe('the model property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.User.', function() {
      expect(this.col.model).to.equal(Kinvey.Backbone.User);
    });
  });

  // Kinvey.Backbone.UserCollection.sync.
  describe('the sync property', function() {
    // Test suite.
    it('should point to Kinvey.Backbone.Sync.', function() {
      expect(this.col.sync.toString()).to.contain('Kinvey.Backbone.Sync');
    });
  });

  // Kinvey.Backbone.UserCollection.count.
  describe('the count method', function() {
    // Test suite.
    it('should count the number of users.', function() {
      var promise = this.jQueryToKinveyPromise(this.col.count());
      return expect(promise).to.be.fulfilled;
    });
    it('should count the number of users, with query.', function() {
      var query   = new Kinvey.Query().equalTo('username', this.user.username);
      var promise = this.jQueryToKinveyPromise(this.col.count({ query: query }));
      return promise.then(function(response) {
        return expect(response[0]).to.equal(1);
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var _this   = this;
      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should not trigger an error event.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should not trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.col.count();
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be.a('number');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy     = sinon.spy();

      var _this   = this;
      var promise = this.col.count({ success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.col.count({ error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });

  // Kinvey.Backbone.UserCollection.group.
  describe('the group method', function() {
    // Housekeeping: define an empty aggregation.
    beforeEach(function() {
      this.agg = new Kinvey.Group();
    });
    afterEach(function() {// Cleanup.
      delete this.agg;
    });

    // Test suite.
    it('should group by.', function() {
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg));
      return expect(promise).to.be.fulfilled;
    });
    it('should group with query.', function() {
      var query   = new Kinvey.Query().equalTo('field', this.randomID());
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg, { query: query }));
      return promise.then(function(response) {
        return expect(response[0]).to.deep.equal([]);
      });
    });
    it('should trigger a request event.', function() {
      var spy = sinon.spy();
      this.col.on('request', spy);

      var _this   = this;
      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args).to.have.length(3);
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.have.property('readyState');// jQuery xhr.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should not trigger an error event.', function() {
      Kinvey.appKey = this.randomID();// Force failure.

      var spy = sinon.spy();
      this.col.on('error', spy);

      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should not trigger a sync event.', function() {
      var spy = sinon.spy();
      this.col.on('sync', spy);

      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function() {
        expect(spy).not.to.be.called;
      });
    });
    it('should return a Backbone promise.', function() {
      var promise = this.col.group(this.agg);
      return this.jQueryToKinveyPromise(promise).then(function(args) {
        expect(args).to.have.length(3);
        expect(args[0]).to.be.an('array');// The response.
        expect(args[1]).to.exist;// statusText.
        expect(args[2]).to.have.property('readyState');// jQuery xhr.
      });
    });
    it('should support callbacks on success.', function() {
      var spy     = sinon.spy();

      var _this   = this;
      var promise = this.col.group(this.agg, { success: spy });
      return this.jQueryToKinveyPromise(promise).then(function(response) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(response[0]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
    it('should support callbacks on failure.', function() {
      Kinvey.appKey = this.randomID();// Force failure.
      var spy = sinon.spy();

      var _this   = this;
      var promise = this.jQueryToKinveyPromise(this.col.group(this.agg, { error: spy }));
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(spy).to.be.calledOnce;

        // Inspect arguments.
        var args = spy.lastCall.args;
        expect(args[0]).to.equal(_this.col);
        expect(args[1]).to.equal(error[2]);// The response.
        expect(args[2]).to.be.an('object');// Options.
      });
    });
  });
});
/**
 * Copyright 2014 Kinvey, Inc.
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

/**
 * Test suite for `Kinvey.User`.
 */
describe('Kinvey.User', function() {

  // Housekeeping: spy on logout.
  beforeEach(function() {
    sinon.spy(Kinvey.User, 'logout');
  });
  afterEach(function() {// Restore original.
    Kinvey.User.logout.restore();
  });

  // Kinvey.User.signup.
  describe('the signup method', function() {
    // Housekeeping: delete the created user (if any).
    afterEach(function() {
      var user = Kinvey.getActiveUser();
      if(null !== user) {
        return Kinvey.User.destroy(user._id, { hard: true });
      }
    });

    // Test suite.
    it('should create a new user.', function() {
      var promise = Kinvey.User.signup().then(function(response) {
        expect(response).to.have.property('username');
        expect(response).to.have.property('password');
        expect(response).to.have.deep.property('_kmd.authtoken');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should create a new user with preseeded data.', function() {
      var data = {// Preseeded data.
        username  : this.randomID(),
        password  : this.randomID(),
        attribute : this.randomID()
      };
      var promise = Kinvey.User.signup(data).then(function(response) {
        expect(response).to.have.property('username', data.username);
        expect(response).to.have.property('password', data.password);
        expect(response).to.have.property('attribute', data.attribute);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should discard preseeded _id and _kmd.', function() {
      var data = {// Preseeded data.
        _id  : this.randomID(),
        _kmd : this.randomID()
      };
      var promise = Kinvey.User.signup(data).then(function(response) {
        expect(response).to.contain.keys(['_id', '_kmd']);
        expect(response._id, '_id').not.to.equal(data._id);
        expect(response._kmd, '_kmd').not.to.equal(data._kmd);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should login the created user.', function() {
      var promise = Kinvey.User.signup().then(function(response) {
        expect(response).to.deep.equal(Kinvey.getActiveUser());
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when there is already an active user.', function() {
      // Mock the active user.
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var spy = sinon.spy();
      var promise = Kinvey.User.signup(null, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        Kinvey.setActiveUser(null);// Reset.

        expect(error).to.have.property('name', Kinvey.Error.ALREADY_LOGGED_IN);
        expect(spy).to.be.calledOnce;
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.signup({}, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.signup({}, options);
    }));
  });

  // Kinvey.User.signupWithProvider.
  describe('the signupWithProvider method', function() {
    afterEach(function() {
      if(Kinvey.User.signup.restore) {// Restore.
        Kinvey.User.signup.restore();
      }
      Kinvey.setActiveUser(null);// Cleanup.
    });

    // Tests.
    it('should forward to the signup method.', function() {
      var stub = sinon.stub(Kinvey.User, 'signup', function() {
        return Kinvey.Defer.resolve();
      });
      var promise = Kinvey.User.signupWithProvider(this.randomID(), { });
      return promise.then(function() {
        expect(stub).to.be.calledOnce;
      });
    });
    it('should fail when there is already an active user.', function() {
      // Mock the active user.
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var spy = sinon.spy();
      var promise = Kinvey.User.signupWithProvider(this.randomID(), { }, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ALREADY_LOGGED_IN);
        expect(spy).to.be.calledOnce;
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      sinon.stub(Kinvey.User, 'signup', function() {
        options.success(null);
        return Kinvey.Defer.resolve(null);
      });
      return Kinvey.User.signupWithProvider(this.randomID(), { }, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });// Force failure.
      return Kinvey.User.signupWithProvider(this.randomID(), { }, options);
    }));
  });

  // Kinvey.User.login.
  describe('the login method', function() {
    // Housekeeping: create test user.
    before(function() {
      var _this = this;
      return Kinvey.User.create({}, { state: false }).then(function(user) {
        _this.data = user;
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
    it('should throw on invalid arguments.', function() {
      var _this = this;
      expect(function() {
        Kinvey.User.login({ foo: _this.randomID() });
      }).to.Throw('_socialIdentity');
    });
    it('should login a user.', function() {
      var _this = this;
      var promise = Kinvey.User.login(this.data.username, this.data.password).then(function(user) {
        expect(user).to.have.property('username', _this.data.username);
        expect(user).not.to.have.property('password');
        expect(user).to.deep.equal(Kinvey.getActiveUser());
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should login a user, with user data as input.', function() {
      var _this = this;
      var promise = Kinvey.User.login({
        username: this.data.username,
        password: this.data.password
      }).then(function(user) {
        expect(user).to.have.property('username', _this.data.username);
        expect(user).not.to.have.property('password');
        expect(user).to.deep.equal(Kinvey.getActiveUser());
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when there is already an active user.', function() {
      // Mock the active user.
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var spy = sinon.spy();
      var promise = Kinvey.User.login(this.data.username, this.data.password, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ALREADY_LOGGED_IN);
        expect(spy).to.be.calledOnce;
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.login(this.data.username, this.data.password, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.login(this.randomID(), this.randomID(), options);
    }));
  });

  // Kinvey.User.loginWithProvider.
  describe('the loginWithProvider method', function() {
    afterEach(function() {
      if(Kinvey.User.login.restore) {// Restore.
        Kinvey.User.login.restore();
      }
      Kinvey.setActiveUser(null);// Cleanup.
    });

    // Tests.
    it('should forward to the login method.', function() {
      var stub = sinon.stub(Kinvey.User, 'login', function() {
        return Kinvey.Defer.resolve();
      });
      var promise = Kinvey.User.loginWithProvider(this.randomID(), { });
      return promise.then(function() {
        expect(stub).to.be.calledOnce;
      });
    });
    it('should fail when there is already an active user.', function() {
      // Mock the active user.
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var spy = sinon.spy();
      var promise = Kinvey.User.loginWithProvider(this.randomID(), { }, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.ALREADY_LOGGED_IN);
        expect(spy).to.be.calledOnce;
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      sinon.stub(Kinvey.User, 'login', function() {
        options.success(null);
        return Kinvey.Defer.resolve(null);
      });
      return Kinvey.User.loginWithProvider(this.randomID(), { }, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.loginWithProvider(this.randomID(), { }, options);
    }));
  });

  // Kinvey.User.logout.
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

    // Test suite.
    it('should logout the active user.', function() {
      var user = Kinvey.getActiveUser();
      var promise = Kinvey.User.logout().then(function(response) {
        expect(Kinvey.getActiveUser()).to.be['null'];
        expect(response).to.deep.equal(user);// Previous user.
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when there is no active user.', function() {
      Kinvey.setActiveUser(null);

      var promise = Kinvey.User.logout();
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.NO_ACTIVE_USER);
      });
    });
    it('should succeed when there is no active user and the `silent` flag was set.', function() {
      Kinvey.setActiveUser(null);

      var promise = Kinvey.User.logout({ silent: true });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when the active user is invalid.', function() {
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var promise = Kinvey.User.logout();
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.INVALID_CREDENTIALS);
        expect(error).to.have.property('debug');
        expect(error.debug).to.contain('Kinvey.User.logout');
        expect(error.debug).to.contain('Kinvey.User.login');
      });
    });
    it('should succeed when the active user is invalid and the `force` flag was set.', function() {
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var promise = Kinvey.User.logout({ force: true });
      return promise.then(function() {
        expect(Kinvey.getActiveUser()).to.be['null'];
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.logout(options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.setActiveUser(null);// Force failure.
      return Kinvey.User.logout(options);
    }));
  });

  // Kinvey.User.me.
  describe('the me method', function() {
    // Housekeeping: manage the active user.
    beforeEach(function() {
      Kinvey.setActiveUser(this.user);
    });
    afterEach(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Test suite.
    it('should return the active user.', function() {
      var _this = this;
      var promise = Kinvey.User.me().then(function(response) {
        expect(response).to.have.property('username', _this.user.username);
        expect(response).not.to.have.property('password');
        expect(response).to.have.deep.property('_kmd.authtoken');
        expect(response._kmd.authtoken).not.to.equal(_this.user._kmd.authtoken);
        expect(response).to.deep.equal(Kinvey.getActiveUser());
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when there is no active user.', function() {
      Kinvey.setActiveUser(null);
      var promise = Kinvey.User.me();
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.NO_ACTIVE_USER);
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.me(options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.setActiveUser(null);// Force failure.
      return Kinvey.User.me(options);
    }));
  });

  // Kinvey.User.create.
  describe('the create method', function() {
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
      var promise = Kinvey.User.create().then(function(response) {
        expect(response).to.have.property('username');
        expect(response).to.have.property('password');
        expect(response).to.have.deep.property('_kmd.authtoken');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should create a new user with preseeded data.', function() {
      var data = {// Random data.
        username  : this.randomID(),
        password  : this.randomID(),
        attribute : this.randomID()
      };
      var promise = Kinvey.User.create(data).then(function(response) {
        expect(response).to.have.property('username', data.username);
        expect(response).to.have.property('password', data.password);
        expect(response).to.have.property('attribute', data.attribute);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should discard preseeded _id and _kmd.', function() {
      var data = {
        _id  : this.randomID(),
        _kmd : this.randomID()
      };
      var promise = Kinvey.User.create(data).then(function(response) {
        expect(response).to.contain.keys(['_id', '_kmd']);
        expect(response._id, '_id').to.not.equal(data._id);
        expect(response._kmd, '_kmd').to.not.equal(data._kmd);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should login the created user.', function() {
      var promise = Kinvey.User.create().then(function(response) {
        expect(response).to.deep.equal(Kinvey.getActiveUser());
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should not logout the previous active user if the `state` flag was false.', function() {
      var promise = Kinvey.User.create({}, { state: false }).then(function(response) {
        expect(Kinvey.User.logout).not.to.be.called;

        // User should be destroyed after test, so mark as the active user.
        Kinvey.setActiveUser(response);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should not login the created user if the `state` flag was false.', function() {
      var promise = Kinvey.User.create({}, { state: false }).then(function(response) {
        expect(Kinvey.getActiveUser()).to.be['null'];

        // User should be destroyed after test, so mark as the active user.
        Kinvey.setActiveUser(response);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when there is already an active user.', function() {
      // Mock the active user.
      Kinvey.setActiveUser({ _id: this.randomID(), _kmd: { authtoken: this.randomID() } });

      var spy = sinon.spy();
      var promise = Kinvey.User.create(null, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        Kinvey.setActiveUser(null);// Reset.
        expect(error).to.have.property('name', Kinvey.Error.ALREADY_LOGGED_IN);
        expect(spy).to.be.calledOnce;
      });
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.create({}, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.create({}, options);
    }));
  });

  // Kinvey.User.verifyEmail.
  describe('the verifyEmail method', function() {
    it('should request e-mail verification.', function() {
      var promise = Kinvey.User.verifyEmail(this.randomID());
      return expect(promise).to.become(null);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.verifyEmail(this.randomID(), options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.verifyEmail(this.randomID(), options);
    }));
  });

  // Kinvey.User.forgotUsername.
  describe('the forgotUsername method', function() {
    // Test suite.
    it('should request a username reminder.', function() {
      var promise = Kinvey.User.forgotUsername(this.randomID());
      return expect(promise).to.become(null);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.forgotUsername(this.randomID(), options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.forgotUsername(this.randomID(), options);
    }));
  });

  // Kinvey.User.resetPassword.
  describe('the resetPassword method', function() {
    // Test suite.
    it('should request a password reset.', function() {
      var promise = Kinvey.User.resetPassword(this.randomID());
      return expect(promise).to.become(null);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.resetPassword(this.randomID(), options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.resetPassword(this.randomID(), options);
    }));
  });

  // Kinvey.User.exists.
  describe('the exists method', function() {
    // Test suite.
    it('should return true when a username exists.', function() {
      var promise = Kinvey.User.exists(this.user.username);
      return expect(promise).to.become(true);
    });
    it('should return false when a username does not exist.', function() {
      var promise = Kinvey.User.exists(this.randomID());
      return expect(promise).to.become(false);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.exists(this.randomID(), options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appSecret = this.randomID();// Force failure.
      return Kinvey.User.exists(this.randomID(), options);
    }));
  });

  // Kinvey.User.update.
  describe('the update method', function() {
    // Housekeeping: manage the active user.
    before(function() {
      Kinvey.setActiveUser(this.user);
    });
    after(function() {// Reset.
      // The tests may alter the users password or authtoken, so obtain latest
      // copy of the user here.
      var user = Kinvey.getActiveUser();
      if(null !== user) {
        this.user = Kinvey.setActiveUser(null);// Returns user.
      }
    });

    // Housekeeping: create another user.
    before(function() {
      var _this = this;
      var acl = { gr: true, gw: true };// Publicly accessible.
      return Kinvey.User.create({ _acl: acl }, { state: false }).then(function(user) {
        _this.data = user;
      });
    });
    after(function() {
      Kinvey.setActiveUser(this.data);
      return Kinvey.User.destroy(this.data._id, { hard: true }).then(function() {
        Kinvey.setActiveUser(null);// Reset.
      });
    });
    after(function() {// Cleanup.
      delete this.data;
    });

    // Test suite.
    it('should throw when missing required argument: data._id.', function() {
      expect(function() {
        Kinvey.User.update({});
      }).to.Throw('_id');
    });
    it('should fail when the user does not exist.', function() {
      var promise = Kinvey.User.update({ _id: this.randomID() });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.USER_NOT_FOUND);
      });
    });
    it('should update a user.', function() {
      var promise = Kinvey.User.update(this.data);
      return expect(promise).to.be.fulfilled;
    });
    it('should update a users password.', function() {
      var user = Kinvey.getActiveUser();
      user.password = this.randomID();

      var promise = Kinvey.User.update(user).then(function(response) {
        expect(response).not.to.have.property('password');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should refresh the active user.', function() {
      var user = Kinvey.getActiveUser();
      var promise = Kinvey.User.update(user).then(function(response) {
        expect(response).not.to.deep.equal(user);// _kmd is different.
        expect(response).to.contain.keys(['_id', '_kmd']);
        expect(response._id).to.equal(user._id);// _id is the same.
        expect(response._kmd).to.have.property('authtoken');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.update(this.data, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.update({ _id: this.randomID() }, options);
    }));
  });

  // Kinvey.User.find.
  describe('the find method', function() {
    // Housekeeping: manage the active user.
    before(function() {
      Kinvey.setActiveUser(this.user);
    });
    after(function() {
      Kinvey.setActiveUser(null);
    });

    // Housekeeping: create a test users.
    before(function() {
      var _this = this;
      return Kinvey.User.create({}, { state: false }).then(function(user) {
        _this.data = user;
      });
    });
    after(function() {// Delete the test user using its credentials.
      Kinvey.setActiveUser(this.data);
      return Kinvey.User.destroy(this.data._id, { hard: true }).then(function() {
        Kinvey.setActiveUser(null);// Reset.
      });
    });
    after(function() {// Cleanup.
      delete this.data;
    });

    // Test suite.
    it('should throw on invalid arguments: query.', function() {
      expect(function() {
        Kinvey.User.find({});
      }).to.Throw('Kinvey.Query');
    });
    it('should return all users.', function() {
      var _this = this;
      var promise = Kinvey.User.find().then(function(users) {
        expect(users).to.be.an('array');
        expect(users).to.have.length.of.at.least(2);

        // Inspect array.
        var userIds = users.map(function(user) { return user._id; });
        expect(userIds).to.contain(Kinvey.getActiveUser()._id);
        expect(userIds).to.contain(_this.data._id);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all users, with filter:username.', function() {
      var _this = this;
      var query = new Kinvey.Query().equalTo('username', this.data.username);
      var promise = Kinvey.User.find(query).then(function(users) {
        expect(users).to.be.an('array');
        expect(users).to.have.length(1);

        // Inspect array.
        expect(users[0]).to.have.property('_id', _this.data._id);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all users, with sort:username.', function() {
      var query = new Kinvey.Query().ascending('username');
      var promise = Kinvey.User.find(query).then(function(users) {
        expect(users).to.be.an('array');
        expect(users).to.have.length.of.at.least(2);

        // Inspect array.
        for(var i = 1, j = users.length; i < j; i += 1) {
          expect(users[i - 1].username).to.be.lessThan(users[i].username);
        }
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should return all users, with limit.', function() {
      var query = new Kinvey.Query().limit(1);
      var promise = Kinvey.User.find(query).then(function(users) {
        expect(users).to.be.an('array');
        expect(users).to.have.length(1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it(
      'should use User Discovery, with filter:username, if the `discover` flag was true.',
      function() {
        var _this = this;
        var query = new Kinvey.Query().equalTo('username', this.data.username);
        var promise = Kinvey.User.find(query, { discover: true }).then(function(users) {
          expect(users).to.be.an('array');
          expect(users).to.have.length.of(1);

          // Inspect array.
          expect(users[0]).to.have.keys(['_id', 'username']);
          expect(users[0]).to.have.property('_id', _this.data._id);
        });
        return expect(promise).to.be.fulfilled;
      }
    );
    it(
      'should use User Discovery, with filter:email, if the `discover` flag was true.',
      function() {
        var query = new Kinvey.Query().equalTo('email', this.randomID());
        var promise = Kinvey.User.find(query, { discover: true });
        return expect(promise).to.become([]);
      }
    );
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.find(null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.User.find(null, options);
    }));
  });

  // Kinvey.User.get.
  describe('the get method', function() {
    // Housekeeping: manage the active user.
    before(function() {
      Kinvey.setActiveUser(this.user);
    });
    after(function() {
      Kinvey.setActiveUser(null);
    });

    it('should fail when the user does not exist.', function() {
      var promise = Kinvey.User.get(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.USER_NOT_FOUND);
      });
    });
    it('should return a user.', function() {
      var _this = this;
      var promise = Kinvey.User.get(this.user._id).then(function(response) {
        expect(response).to.have.property('username', _this.user.username);
        expect(response).not.to.have.property('password');
        expect(response).not.to.have.deep.property('_kmd.authtoken');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.get(this.user._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.get(this.randomID(), options);
    }));
  });

  // Kinvey.User.destroy.
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
      var _this = this;
      var acl = { gr: true, gw: true };// Publicly accessible.
      return Kinvey.User.create({ _acl: acl }, { state: false }).then(function(user) {
        _this.data = user;
      });
    });
    afterEach(function() {// Delete the user using the Master Secret.
      // Failure is OK, since the test may have deleted the user already.
      Kinvey.masterSecret = config.test.masterSecret;
      return Kinvey.User.destroy(this.data._id, { hard: true, silent: true }).then(function() {
        Kinvey.masterSecret = null;// Reset.
      });
    });
    afterEach(function() {// Cleanup.
      delete this.data;
    });

    // Test suite.
    it('should suspend a user.', function() {
      var _this = this;
      var promise = Kinvey.User.destroy(this.data._id).then(function(response) {
        expect(response).to.be['null'];

        // Try and restore the user.
        Kinvey.masterSecret = config.test.masterSecret;
        return Kinvey.User.restore(_this.data._id);
      });
      return expect(promise).to.become(null);
    });
    it('should permanently delete a user if the `hard` flag was set.', function() {
      var _this = this;
      var promise = Kinvey.User.destroy(this.data._id, { hard: true }).then(function(response) {
        expect(response).to.be['null'];

        // Try and restore the user.
        Kinvey.masterSecret = config.test.masterSecret;
        return Kinvey.User.restore(_this.data._id);
      });
      return expect(promise).to.be.rejected;
    });
    it('should logout the active user.', function() {
      Kinvey.setActiveUser(this.data);
      var promise = Kinvey.User.destroy(this.data._id).then(function() {
        expect(Kinvey.getActiveUser()).to.be['null'];
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should fail when the user does not exist.', function() {
      var promise = Kinvey.User.destroy(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.USER_NOT_FOUND);
      });
    });
    it('should succeed when the user does not exist, and the `silent` flag was set.', function() {
      var promise = Kinvey.User.destroy(this.randomID(), { silent: true });
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.destroy(this.data._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.destroy(this.randomID(), options);
    }));
  });

  // Kinvey.User.restore.
  describe('the restore method', function() {
    // Housekeeping: enable Master Secret.
    before(function() {
      Kinvey.masterSecret = config.test.masterSecret;
    });

    // Housekeeping: create and suspend a user.
    before(function() {
      var _this = this;
      return Kinvey.User.create({}, { state: false }).then(function(user) {
        _this.data = user;
      });
    });
    beforeEach(function() {// Suspend the user.
      return Kinvey.User.destroy(this.data._id);
    });
    after(function() {// Delete the user using the Master Secret.
      return Kinvey.User.destroy(this.data._id, { hard: true });
    });
    after(function() {// Cleanup.
      delete this.data;
    });

    // Housekeeping: disable Master Secret.
    after(function() {// Reset.
      Kinvey.masterSecret = null;
    });

    // Test suite.
    it('should fail when the user does not exist.', function() {
      var promise = Kinvey.User.restore(this.randomID());
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(error) {
        expect(error).to.have.property('name', Kinvey.Error.USER_NOT_FOUND);
      });
    });
    it('should restore a suspended user.', function() {
      var promise = Kinvey.User.restore(this.data._id);
      return expect(promise).to.be.fulfilled;
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.restore(this.data._id, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      return Kinvey.User.restore(this.randomID(), options);
    }));
  });

  // Kinvey.User.count.
  describe('the count method', function() {
    // Housekeeping: manage the active user.
    before(function() {
      Kinvey.setActiveUser(this.user);
    });
    after(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Test suite.
    it('should count the number of users.', function() {
      var promise = Kinvey.User.count();
      return expect(promise).to.be.fulfilled;
    });
    it('should count the number of documents, with query.', function() {
      var query = new Kinvey.Query().equalTo('username', this.user.username);
      var promise = Kinvey.User.count(query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents, regardless of sort.', function() {
      var query   = new Kinvey.Query();
      query.equalTo('username', this.user.username);
      query.ascending(this.randomID());
      var promise = Kinvey.User.count(query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents, regardless of limit.', function() {
      var query = new Kinvey.Query().equalTo('username', this.user.username).limit(10);
      var promise = Kinvey.User.count(query);
      return expect(promise).to.become(1);
    });
    it('should count the number of documents, regardless of skip.', function() {
      var query = new Kinvey.Query().equalTo('username', this.user.username).skip(10);
      var promise = Kinvey.User.count(query);
      return expect(promise).to.become(1);
    });
    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.count(null, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      Kinvey.appKey = this.randomID();// Force failure.
      return Kinvey.User.count(null, options);
    }));
  });

  // Kinvey.DataStore.group.
  describe('the group method', function() {
    // Housekeeping: manage the active user.
    before(function() {
      Kinvey.setActiveUser(this.user);
    });
    after(function() {// Reset.
      Kinvey.setActiveUser(null);
    });

    // Housekeeping: create another user.
    before(function() {
      var _this = this;
      return Kinvey.User.create({ field: 1 }, { state: false }).then(function(user) {
        _this.anotherUser = user;
      });
    });
    after(function() {
      Kinvey.setActiveUser(this.anotherUser);
      return Kinvey.User.destroy(this.anotherUser._id, { hard: true }).then(function() {
        Kinvey.setActiveUser(null);// Reset.
      });
    });

    // Housekeeping: define an empty aggregation.
    beforeEach(function() {
      this.agg = new Kinvey.Group();
    });
    afterEach(function() {// Cleanup.
      delete this.agg;
    });

    // Test suite.
    it('should fail on invalid arguments: aggregation.', function() {
      expect(function() {
        Kinvey.User.group(null);
      }).to.Throw('Kinvey.Group');
    });
    it('should accept an empty aggregation.', function() {
      var promise = Kinvey.User.group(this.agg);
      return expect(promise).to.become([{}]);
    });
    it('should group by.', function() {
      this.agg.by('username');
      var promise = Kinvey.User.group(this.agg).then(function(response) {
        expect(response).to.have.deep.property('[0].username');
        expect(response).to.have.deep.property('[1].username');
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should group by, with sort, limit, and skip.', function() {
      var query = new Kinvey.Query().ascending('username').limit(1).skip(1);
      this.agg.by('username').query(query);
      var promise = Kinvey.User.group(this.agg).then(function(response) {
        expect(response).to.have.length(1);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should group with query.', function() {
      var query = new Kinvey.Query().equalTo('username', this.user.username);
      this.agg.by('username').query(query);

      var _this = this;
      var promise = Kinvey.User.group(this.agg).then(function(response) {
        expect(response).to.have.deep.property('[0].username');
        expect(response[0].username).to.equal(_this.user.username);
      });
      return expect(promise).to.be.fulfilled;
    });
    it('should group with initial.', function() {
      var initial = { field : 0 };
      this.agg.initial(initial);

      var promise = Kinvey.User.group(this.agg);
      return expect(promise).to.become([ initial ]);
    });
    it('should group with reduce.', function() {
      this.agg.initial('result', 0);
      this.agg.reduce(function(doc, out) {
        out.result = 1;
      });

      var promise = Kinvey.User.group(this.agg);
      return expect(promise).to.become([ { result: 1 } ]);
    });

    it('should count.', function() {
      var promise = Kinvey.User.group(Kinvey.Group.count());
      return expect(promise).to.become([ { result: 2 } ]);
    });
    it('should sum.', function() {
      var agg = Kinvey.Group.sum('field');
      agg.query(new Kinvey.Query().exists('field'));

      var promise = Kinvey.User.group(agg);
      return expect(promise).to.become([ { result: 1 } ]);
    });
    it('should min.', function() {
      var agg = Kinvey.Group.min('field');
      agg.query(new Kinvey.Query().exists('field'));

      var promise = Kinvey.User.group(agg);
      return expect(promise).to.become([ { result: 1 } ]);
    });
    it('should max.', function() {
      var agg = Kinvey.Group.max('field');
      agg.query(new Kinvey.Query().exists('field'));

      var promise = Kinvey.User.group(agg);
      return expect(promise).to.become([ { result: 1 } ]);
    });
    it('should average.', function() {
      var agg = Kinvey.Group.average('field');
      agg.query(new Kinvey.Query().exists('field'));

      var promise = Kinvey.User.group(agg);
      return expect(promise).to.become([ { count: 1, result: 1 } ]);
    });

    it('should support both deferreds and callbacks on success.', Common.success(function(options) {
      return Kinvey.User.group(this.agg, options);
    }));
    it('should support both deferreds and callbacks on failure.', Common.failure(function(options) {
      this.agg.reduce(this.randomID());// Force failure.
      return Kinvey.User.group(this.agg, options);
    }));
  });

});
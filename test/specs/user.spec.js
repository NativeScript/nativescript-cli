require('../setup');
import User from '../../src/core/user';

describe('User', function() {
  beforeEach(function() {
    // Create a user
    this.user = new User({
      _id: this.randomString(),
      _kmd: {
        authtoken: this.randomString()
      }
    });
  });

  it('should be a class', function() {
    User.should.be.a.Function();
  });

  describe('username property', function() {

  });

  describe('password property', function() {

  });

  describe('authtoken property', function() {

  });

  describe('isActive method', function() {

    // afterEach(function() {
    //   // Set the acvtive user to null
    //   User.setActive(null);
    // });

    it('should return true for an active user', function() {
      // Set the active user
      //User.setActive(this.user);

      // Expectations
      this.user.isActive().should.be.true;
    });

    it('should return false for an inactive user', function() {
      this.user.isActive().should.not.be.true;
    });
  });

  describe('logout method', function() {
    before(function() {
      this.server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}/login`);
    });

    beforeEach(function() {
      User.setActive(this.user);
    });

    afterEach(function() {
      return User.logout();
    });

    it('should logout the active user', function() {
      let user = User.getActive();
      return user.logout().then(() => {
        user.isActive().should.be.false;
        should.not.exist(User.getActive());
      });
    });

    it('should succeed when there is no active user', function() {
      User.setActive(null);
      return User.logout().should.be.fulfilled();
    });
  });

  describe('me method', function() {

    it('should fail when there is no active user');
    it('should return the user on a success');
  });

  describe('signup method', function() {
    let server;

    before(function() {
      server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}`);
    });

    afterEach(function() {
      // scope.post(`/user/${kinvey.appKey}/_logout`).reply(200);
      return User.logout();
    });

    it('should return a promise', function() {
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: this.randomString(),
          password: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Signup
      let scope = server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);
      let promise = User.signup().then(() => {
        scope.done();
      });

      // Expectations
      promise.should.be.a.Promise();

      // Return the promise
      return promise;
    });

    it('should create a new user', function() {
      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: this.randomString(),
          password: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.signup().then((user) => {
        // Expectations
        user.should.have.property('_id', apiResponse.data._id);
        user.should.have.property('username', apiResponse.data.username);
        user.should.have.property('password', apiResponse.data.password);
        user.should.have.propertyByPath('_kmd', 'authtoken').eql(apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should create a new user with data provided', function() {
      // Create some data
      let data = {
        username: this.randomString(),
        password: this.randomString(),
        attribute: this.randomString()
      };

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: data.username,
          password: data.password,
          attribute: data.attribute,
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.signup(data).then((user) => {
        // Expectations
        user.username.should.equal(data.username);
        user.password.should.equal(data.password);
        user.attribute.should.equal(data.attribute);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should replace _id and _kmd', function() {
      // Create some data
      let data = {
        _id: this.randomString(),
        _kmd: this.randomString()
      };

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: this.randomString(),
          password: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.signup(data).then((user) => {
        // Expectations
        user._id.should.not.equal(data._id);
        user._kmd.should.not.equal(data._kmd);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should login the created user', function() {
      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: this.randomString(),
          password: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.signup().then((user) => {
        let activeUser = User.getActive();

        // Expectations
        should.deepEqual(user, activeUser.toJSON());

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.setActive(this.user);

      // Signup
      return User.signup().catch((error) => {
        error.message.should.equal('Already logged in.');
      });
    });
  });

  describe('signupWithProvider method', function() {
    before(function() {
      this.server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}`);
    });

    afterEach(() => {
      // scope.post(`/user/${kinvey.appKey}/_logout`).reply(200);
      return User.logout();
    });

    it('should forward to the signup method', function() {
      // Stub the signup method
      let stub = sinon.stub(User, 'signup', () => {
        return Promise.resolve();
      });

      // Signup
      return User.signupWithProvider('testing', {}).then(() => {
        // Expectations
        stub.should.be.calledOnce();

        // Restore the signup method
        User.signup.restore();
      });
    });

    it('should create a new user with data provided', function() {
      let provider = this.randomString();
      let tokens = {};

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          },
          _socialIdentity: {}
        }
      };
      apiResponse.data._socialIdentity[provider] = tokens;

      // Setup response
      let scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.signupWithProvider(provider, tokens).then((user) => {
        // Expectations
        user.should.have.property('_socialIdentity');
        should.deepEqual(user._socialIdentity, apiResponse.data._socialIdentity);

        // Make sure the scope is done
        scope.done();
      });
    });
  });

  describe('login method', function() {
    before(function() {
      this.server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}/login`);
    });

    afterEach(function() {
      return User.logout();
    });

    it('should fail with invalid arguments', function() {
      return User.login({
        foo: this.randomString()
      }).catch((e) => {
        e.should.not.be.undefined;
      });
    });

    it('should login a user provided a username and password', function() {
      let username = this.randomString();
      let password = this.randomString();

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: username,
          password: password,
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Login
      return User.login(username, password).then((user) => {
        // Expectations
        user.should.have.property('_id', apiResponse.data._id);
        user.should.have.property('username', apiResponse.data.username);
        user.should.have.property('password', apiResponse.data.password);
        user.should.have.propertyByPath('_kmd', 'authtoken').eql(apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should login a user provided an object with username and password', function() {
      let username = this.randomString();
      let password = this.randomString();

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          username: username,
          password: password,
          _kmd: {
            authtoken: this.randomString()
          }
        }
      };

      // Setup response
      let scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Login
      return User.login({
        username: username,
        password: password
      }).then((user) => {
        // Expectations
        user.should.have.property('_id', apiResponse.data._id);
        user.should.have.property('username', apiResponse.data.username);
        user.should.have.property('password', apiResponse.data.password);
        user.should.have.propertyByPath('_kmd', 'authtoken').eql(apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.setActive(this.user);

      // Login
      return User.login().catch((e) => {
        e.should.not.be.undefined();
      });
    });
  });

  describe('loginWithProvider method', function() {
    before(function() {
      this.server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}/login`);
    });

    afterEach(function() {
      return User.logout();
    });

    it('should forward to the login method', function() {
      let provider = this.randomString();
      let tokens = {};

      // Stub the login method
      let stub = sinon.stub(User, 'login', () => {
        return Promise.resolve();
      });

      // Login
      return User.loginWithProvider(provider, tokens).then(() => {
        // Expectations
        stub.should.be.calledOnce();

        // Restore the login method
        User.login.restore();
      });
    });

    it('should login a user', function() {
      let provider = this.randomString();
      let tokens = {};

      // Create an API response
      let apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: this.randomString(),
          _kmd: {
            authtoken: this.randomString()
          },
          _socialIdentity: {}
        }
      };
      apiResponse.data._socialIdentity[provider] = tokens;

      // Setup response
      let scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      return User.loginWithProvider(provider, tokens).then((user) => {
        // Expectations
        user.should.have.property('_socialIdentity', apiResponse.data._socialIdentity);

        // Make sure the scope is done
        scope.done();
      });
    });
  });

  describe('resetPassword method', function() {

  });

  describe('verifyEmail method', function() {

  });

  describe('forgotUsername method', function() {

  });

  describe('exists', function() {

  });

  describe('getActive', function() {

  });

  describe('setActive', function() {

  });
});

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
    expect(User).to.be.a('Function');
  });

  describe('username property', function() {

  });

  describe('password property', function() {

  });

  describe('authtoken property', function() {

  });

  describe('isActive method', function() {

    afterEach(function() {
      // Set the acvtive user to null
      User.active = null;
    });

    it('should return true for an active user', function() {
      // Set the active user
      User.active = this.user;

      // Expectations
      expect(this.user.isActive()).to.be.truthy;
    });

    it('should return false for an inactive user', function() {
      // Expectations
      expect(this.user.isActive()).to.not.be.truthy;
    });
  });

  describe('logout method', function() {
    before(function() {
      this.server = nock(this.apiUrl).post(`/user/${this.kinvey.appKey}/login`);
    });

    beforeEach(function() {
      // Set the active user.
      User.active = this.user;
    });

    afterEach(function() {
      return User.logout();
    });

    it('should logout the active user', function() {
      // Logout
      return User.logout().then(() => {
        // Expectations
        expect(User.active).to.be.null;
      });
    });

    it('should succeed when there is no active user', function() {
      // Set the current user to null
      User.active = null;

      // Logout
      return User.logout();
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
      let promise = User.signup().then(() => {
        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.an.instanceof(Promise);

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
        expect(user).to.have.property('_id', apiResponse.data._id);
        expect(user).to.have.property('username', apiResponse.data.username);
        expect(user).to.have.property('password', apiResponse.data.password);
        expect(user).to.have.deep.property('_kmd.authtoken', apiResponse.data._kmd.authtoken);

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
        expect(user.username).to.equal(data.username);
        expect(user.password).to.equal(data.password);
        expect(user.attribute).to.equal(data.attribute);

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
        expect(user._id).not.to.equal(data._id);
        expect(user._kmd).not.to.equal(data._kmd);

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
        // Expectations
        expect(user).to.deep.equal(User.active.data);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.active = this.user;

      // Signup
      return User.signup().catch((error) => {
        expect(error.message).to.equal('Already logged in.');
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
        expect(stub).to.be.calledOnce;

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
        expect(user).to.have.property('_socialIdentity');
        expect(user._socialIdentity).to.deep.equal(apiResponse.data._socialIdentity);

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
        expect(e).to.not.be.undefined;
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
        expect(user).to.have.property('_id', apiResponse.data._id);
        expect(user).to.have.property('username', apiResponse.data.username);
        expect(user).to.have.property('password', apiResponse.data.password);
        expect(user).to.have.deep.property('_kmd.authtoken', apiResponse.data._kmd.authtoken);

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
        expect(user).to.have.property('_id', apiResponse.data._id);
        expect(user).to.have.property('username', apiResponse.data.username);
        expect(user).to.have.property('password', apiResponse.data.password);
        expect(user).to.have.deep.property('_kmd.authtoken', apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.active = this.user;

      // Login
      return User.login().catch((e) => {
        expect(e).to.not.be.undefined;
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
        expect(stub).to.be.calledOnce;

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
        expect(user).to.have.property('_socialIdentity');
        expect(user._socialIdentity).to.deep.equal(apiResponse.data._socialIdentity);

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

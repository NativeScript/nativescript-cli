import User from '../../src/core/user';
import nock from 'nock';
import Kinvey from '../../src/kinvey';

describe('User', function() {
  beforeEach(function() {
    this.user = new User({
      _id: randomString(),
      _kmd: {
        authtoken: randomString()
      }
    });
  });

  afterEach(function() {
    return User.logout();
  });

  describe('#getActive', function() {
    it('should respond', function() {
      expect(User).itself.to.respondTo('getActive');
    });

    it('should return null when there is no active user', function() {
      expect(User.getActive()).to.be.null;
    });

    it('should return the active user when there is an active user', function() {
      User.setActive(this.user);
      const activeUser = User.getActive();
      expect(activeUser).to.deep.equal(this.user);
      expect(activeUser.isActive()).to.be.true;
    });
  });

  describe('#setActive', function() {
    it('should respond', function() {
      expect(User).itself.to.respondTo('setActive');
    });

    it('should set a user as active', function() {
      User.setActive(this.user);
      expect(this.user.isActive()).to.be.true;
    });

    it('should replace an already active user', function() {
      User.setActive(this.user);
      expect(this.user.isActive()).to.be.true;

      const anotherUser = new User({
        _id: global.randomString(),
        _kmd: {
          authtoken: global.randomString()
        }
      });
      User.setActive(anotherUser);

      expect(anotherUser.isActive()).to.be.true;
      expect(this.user.isActive()).to.be.false;
    });
  });

  describe('#isActive', function() {
    it('should respond', function() {
      expect(User).to.respondTo('isActive');
    });

    it('should return true for an active user', function() {
      User.setActive(this.user);
      expect(this.user.isActive()).to.be.true;
    });

    it('should return false for an inactive user', function() {
      expect(this.user.isActive()).to.be.false;
    });
  });

  describe('logout method', function() {
    before(function() {
      this.server = nock(Kinvey.apiUrl).post(`/user/${Kinvey.appKey}/login`);
    });

    beforeEach(function() {
      User.setActive(this.user);
    });

    afterEach(function() {
      return User.logout();
    });

    it('should logout the active user', function() {
      const user = User.getActive();
      return user.logout().then(() => {
        expect(user.isActive()).to.be.false;
        expect(User.getActive()).to.be.null;
      });
    });

    it('should succeed when there is no active user', function() {
      User.setActive(null);
      const promise = User.logout();
      expect(promise).to.be.fulfilled;
      return promise;
    });
  });

  describe('me method', function() {
    it('should fail when there is no active user');
    it('should return the user on a success');
  });

  describe('signup method', function() {
    before(function() {
      this.server = nock(Kinvey.apiUrl).post(`/user/${Kinvey.appKey}`);
    });

    // it('should return a promise', function() {
    //   const apiResponse = {
    //     statusCode: 200,
    //     headers: {
    //       'content-type': 'application/json'
    //     },
    //     data: {
    //       _id: this.randomString(),
    //       username: this.randomString(),
    //       password: this.randomString(),
    //       _kmd: {
    //         authtoken: this.randomString()
    //       }
    //     }
    //   };

    //   // Signup
    //   const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);
    //   const promise = User.signup().then(() => {
    //     scope.done();
    //   });

    //   // Expectations
    //   expect(promise).to.be.fulfilled();

    //   // Return the promise
    //   return promise;
    // });

    it('should create a new user', function() {
      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: randomString(),
          password: randomString(),
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.signup().then((user) => {
        // Expectations
        expect(user).to.have.property('_id', apiResponse.data._id);
        expect(user).to.have.property('username', apiResponse.data.username);
        expect(user).to.have.property('password', apiResponse.data.password);
        expect(user).to.have.deep.property('_kmd.authtoken', apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should create a new user with data provided', function() {
      // Create some data
      const data = {
        username: randomString(),
        password: randomString(),
        attribute: randomString()
      };

      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: data.username,
          password: data.password,
          attribute: data.attribute,
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.signup(data).then((user) => {
        // Expectations
        expect(user).to.have.property('username', data.username);
        expect(user).to.have.property('password', data.password);
        expect(user).to.have.property('attribute', data.attribute);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should replace _id and _kmd', function() {
      // Create some data
      const data = {
        _id: randomString(),
        _kmd: randomString()
      };

      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: randomString(),
          password: randomString(),
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.signup(data).then((user) => {
        // Expectations
        expect(user).to.have.property('_id');
        expect(user._id).to.not.equal(data._id);
        expect(user).to.have.property('_kmd').that.is.an('object');
        expect(user._kmd).to.not.equal(data._kmd);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should login the created user', function() {
      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: randomString(),
          password: randomString(),
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.signup().then((user) => {
        const activeUser = User.getActive();

        // Expectations
        expect(user).to.deep.equal(activeUser.toJSON());

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.setActive(this.user);

      // Signup
      const promise = User.signup().catch((err) => {
        expect(err.message).to.equal('Already logged in.');
      });

      // Expectations
      expect(promise).to.be.rejected;

      // Return the promise
      return promise;
    });
  });

  describe('signupWithProvider method', function() {
    before(function() {
      this.server = nock(Kinvey.apiUrl).post(`/user/${Kinvey.appKey}`);
    });

    it('should forward to the signup method', function() {
      // Stub the signup method
      const signupStub = stub(User, 'signup', () => {
        return Promise.resolve();
      });

      // Signup
      const promise = User.signupWithProvider('testing', {}).then(() => {
        // Expectations
        expect(signupStub).to.be.calledOnce;
      });

      // Expectations
      expect(promise).to.be.rejected;

      // Return the promise
      return promise;
    });

    it('should create a new user with data provided', function() {
      const provider = randomString();
      const tokens = {};
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          _kmd: {
            authtoken: randomString()
          },
          _socialIdentity: {}
        }
      };
      apiResponse.data._socialIdentity[provider] = tokens;

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.signupWithProvider(provider, tokens).then((user) => {
        // Expectations
        expect(user).to.have.property('_socialIdentity');
        expect(user._socialIdentity).to.deep.equal(apiResponse.data._socialIdentity);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.rejected;

      // Return the promise
      return promise;
    });
  });

  describe('login method', function() {
    before(function() {
      this.server = nock(Kinvey.apiUrl).post(`/user/${Kinvey.appKey}/login`);
    });

    it('should fail with invalid arguments', function() {
      const promise = User.login({
        foo: randomString()
      }).catch((err) => {
        expect(err).to.not.be.undefined;
      });

      // Expectations
      expect(promise).to.be.rejected;

      // Return the promise
      return promise;
    });

    it('should login a user provided a username and password', function() {
      const username = randomString();
      const password = randomString();

      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: username,
          password: password,
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Login
      const promise = User.login(username, password).then((user) => {
        // Expectations
        expect(user).to.have.property('_id', apiResponse.data._id);
        expect(user).to.have.property('username', apiResponse.data.username);
        expect(user).to.have.property('password', apiResponse.data.password);
        expect(user).to.have.deep.property('_kmd.authtoken', apiResponse.data._kmd.authtoken);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should login a user provided an object with username and password', function() {
      const username = randomString();
      const password = randomString();

      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          username: username,
          password: password,
          _kmd: {
            authtoken: randomString()
          }
        }
      };

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Login
      const promise = User.login({
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

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should fail when there is already an active user', function() {
      // Set the active user.
      User.setActive(this.user);

      // Login
      const promise = User.login().catch((err) => {
        expect(err).to.not.be.undefined;
      });

      // Expectations
      expect(promise).to.be.rejected;

      // Return the promise
      return promise;
    });
  });

  describe('loginWithProvider method', function() {
    before(function() {
      this.server = nock(Kinvey.apiUrl).post(`/user/${Kinvey.appKey}/login`);
    });

    it('should forward to the login method', function() {
      const provider = randomString();
      const tokens = {};

      // Stub the login method
      const loginStub = stub(User, 'login', () => {
        return Promise.resolve();
      });

      // Login
      const promise = User.loginWithProvider(provider, tokens).then(() => {
        // Expectations
        expect(loginStub).to.be.calledOnce;
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
    });

    it('should login a user', function() {
      const provider = randomString();
      const tokens = {};

      // Create an API response
      const apiResponse = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          _id: randomString(),
          _kmd: {
            authtoken: randomString()
          },
          _socialIdentity: {}
        }
      };
      apiResponse.data._socialIdentity[provider] = tokens;

      // Setup response
      const scope = this.server.reply(apiResponse.statusCode, apiResponse.data, apiResponse.headers);

      // Signup
      const promise = User.loginWithProvider(provider, tokens).then((user) => {
        // Expectations
        expect(user).to.have.property('_socialIdentity');
        expect(user._socialIdentity).to.deep.equal(apiResponse.data._socialIdentity);

        // Make sure the scope is done
        scope.done();
      });

      // Expectations
      expect(promise).to.be.fulfilled;

      // Return the promise
      return promise;
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

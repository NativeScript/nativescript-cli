import { User } from 'src/entity';
import { randomString } from 'src/utils';
import { ActiveUserError, InvalidCredentialsError, KinveyError } from 'src/errors';
import { TestUser } from '../mocks';
import Query from 'src/query';
import expect from 'expect';
import nock from 'nock';
import assign from 'lodash/assign';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('User', function() {
  describe('login()', function() {
    beforeEach(function() {
      return User.logout();
    });

    it('should throw an error if an active user already exists', function() {
      return TestUser.login(randomString(), randomString())
        .then(() => {
          return TestUser.login(randomString(), randomString());
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should throw an error if a username is not provided', async function() {
      try {
        await User.login(null, randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username is an empty string', async function() {
      try {
        await User.login(' ', randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if a password is not provided', async function() {
      try {
        await User.login(randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the password is an empty string', async function() {
      try {
        await User.login(randomString(), ' ');
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username and/or password is invalid', function() {
      let user = new User();
      const username = randomString();
      const password = randomString();

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${user.pathname}/login`, { username: username, password: password })
        .reply(401, {
          name: 'InvalidCredentials',
          message: 'Invalid credentials. Please retry your request with correct credentials'
        }, {
          'Content-Type': 'application/json; charset=utf-8'
        });

      return user.login(username, password)
        .catch((error) => {
          expect(error).toBeA(InvalidCredentialsError);
        });
    });

    it('should login a user', async function() {
      let user = new User();
      const username = randomString();
      const password = randomString();
      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        username: username,
        _acl: {
          creator: randomString()
        }
      };

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${user.pathname}/login`, { username: username, password: password })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      await TestUser.logout();

      // Login
      user = await user.login(username, password);

      // Expectations
      expect(user._id).toEqual(reply._id);
      expect(user.authtoken).toEqual(reply._kmd.authtoken);
      expect(user.username).toEqual(reply.username);

      const isActive = await user.isActive();
      expect(isActive).toEqual(true);
    });

    it('should login a user by providing credentials as an object', async function() {
      let user = new User();
      const username = randomString();
      const password = randomString();
      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        username: username,
        _acl: {
          creator: randomString()
        }
      };

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${user.pathname}/login`, { username: username, password: password })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      await TestUser.logout();

      // Login
      user = await user.login({
        username: username,
        password: password
      });

      // Expectations
      expect(user._id).toEqual(reply._id);
      expect(user.authtoken).toEqual(reply._kmd.authtoken);
      expect(user.username).toEqual(reply.username);

      const isActive = await user.isActive();
      expect(isActive).toEqual(true);
    });

    it('should login a user with _socialIdentity and merge the result', async function() {
      const socialIdentity = { foo: { baz: randomString() }, faa: randomString() };
      let user = new User();
      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        _socialIdentity: {
          foo: {
            bar: randomString()
          }
        },
        username: randomString(),
        _acl: {
          creator: randomString()
        }
      };

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${user.pathname}/login`, { _socialIdentity: socialIdentity })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      await TestUser.logout();

      // Login
      user = await user.login({
        _socialIdentity: socialIdentity
      });

      // Expectations
      expect(user._id).toEqual(reply._id);
      expect(user.authtoken).toEqual(reply._kmd.authtoken);
      expect(user.username).toEqual(reply.username);
      expect(user._socialIdentity.foo.baz).toEqual(socialIdentity.foo.baz);
      expect(user._socialIdentity.foo.bar).toEqual(reply._socialIdentity.foo.bar);
      expect(user._socialIdentity.faa).toEqual(socialIdentity.faa);

      const isActive = user.isActive();
      expect(isActive).toEqual(true);
    });
  });

  describe('verifyEmail()', function() {
    it('should throw an error if a username is not provided', async function() {
      try {
        await User.verifyEmail();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async function() {
      try {
        await User.verifyEmail({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should verify an email for a user', async function() {
      const username = 'test';

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${this.client.appKey}/${username}/user-email-verification-initiate`)
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.verifyEmail(username);
      expect(response).toEqual({});
    });
  });

  describe('resetPassword()', function() {
    it('should throw an error if a username is not provided', async function() {
      try {
        await User.resetPassword();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async function() {
      try {
        await User.resetPassword({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should reset the password for a user', async function() {
      const username = 'test';

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${this.client.appKey}/${username}/user-password-reset-initiate`)
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.resetPassword(username);
      expect(response).toEqual({});
    });
  });

  describe('forgotUsername()', function() {
    it('should throw an error if an email is not provided', async function() {
      try {
        await User.forgotUsername();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided email is not a string', async function() {
      try {
        await User.forgotUsername({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should retrieve a username for a user', async function() {
      const email = 'test@test.com';

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${this.client.appKey}/user-forgot-username`, { email: email })
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.forgotUsername(email);
      expect(response).toEqual({});
    });
  });

  describe('lookup()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function() {
      return User.lookup({}, { discover: true })
        .toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should return an array of users', function() {
      const USERS = [{
        _id: randomString(),
        username: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }, {
        _id: randomString(),
        username: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }];

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${this.client.appKey}/_lookup`)
        .reply(200, USERS);

      return User.lookup()
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);
        });
    });

    it('should return an array of users matching the query', function() {
      const USERS = [{
        _id: randomString(),
        username: 'foo',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }, {
        _id: randomString(),
        username: 'foo',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }];
      const query = new Query();
      query.equalTo('username', 'foo');

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${this.client.appKey}/_lookup`, query.toPlainObject().filter)
        .reply(200, USERS);

      return User.lookup(query)
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);

          users.forEach(function(user) {
            expect(user.username).toEqual('foo');
          });
        });
    });
  });

  describe('update()', function() {
    it('should throw an error if the user does not have an _id', function() {
      const user = new User({ email: randomString() });
      return user.update({ email: randomString })
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('User must have an _id.');
        });
    });

    it('should update the active user', function() {
      return TestUser.logout()
        .then(() => {
          return TestUser.login(randomString(), randomString());
        })
        .then((user) => {
          const email = randomString();
          const requestData = assign(user.data, { email: email })
          const responseData = assign(requestData, { _kmd: { authtoken: randomString() } });

          // Kinvey API response
          nock(this.client.apiHostname, { encodedQueryParams: true })
            .put(`${user.pathname}/${user._id}`, requestData)
            .reply(200, responseData);

          return user.update({ email: email })
            .then(() => {
              const activeUser = User.getActiveUser();
              expect(activeUser.data).toEqual(responseData);
            });
        });
    });

    it('should update a user and not the active user', function() {
      return TestUser.logout()
        .then(() => {
          return TestUser.login(randomString(), randomString());
        })
        .then((activeUser) => {
          const user = new User({ _id: randomString(), email: randomString() });
          const email = randomString();
          const requestData = assign(user.data, { email: email })
          const responseData = assign(requestData, { _kmd: { authtoken: randomString() } });

          // Kinvey API response
          nock(this.client.apiHostname, { encodedQueryParams: true })
            .put(`${user.pathname}/${user._id}`, requestData)
            .reply(200, responseData);

          return user.update({ email: email })
            .then(() => {
              expect(user.data).toEqual(responseData);
              expect(user._kmd.authtoken).toEqual(responseData._kmd.authtoken);
              expect(activeUser.data).toNotEqual(responseData);
              expect(activeUser._kmd.authtoken).toNotEqual(responseData._kmd.authtoken);
            });
        });
    });
  });
});

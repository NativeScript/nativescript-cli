import { User } from '../../../src/entity';
import { randomString } from '../../../src/utils';
import { ActiveUserError, KinveyError } from '../../../src/errors';
import { TestUser } from '../mocks';
import expect from 'expect';
import nock from 'nock';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('User', function() {
  describe('login()', function() {
    it('should throw an error if an active user already exists', async function() {
      try {
        await User.login(randomString(), randomString());
      } catch (error) {
        expect(error).toBeA(ActiveUserError);
      }
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
      const socialIdentity = { foo: randomString() };
      let user = new User();
      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        _socialIdentity: {
          bar: randomString()
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
      expect(user._socialIdentity.foo).toEqual(socialIdentity.foo);
      expect(user._socialIdentity.bar).toEqual(reply._socialIdentity.bar);

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
});

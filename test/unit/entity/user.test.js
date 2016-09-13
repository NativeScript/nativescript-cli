import { User } from '../../../src/entity';
import { randomString } from '../../../src/utils';
import { ActiveUserError, KinveyError } from '../../../src/errors';
import { TestUser } from '../helpers';
import expect from 'expect';
import nock from 'nock';

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
      expect(user.isActive()).toEqual(true);
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
      expect(user.isActive()).toEqual(true);
    });
  });
});

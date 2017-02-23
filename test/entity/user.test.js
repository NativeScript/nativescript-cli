import { User } from 'src/entity';
import { UserMock } from 'test/mocks';
import { randomString } from 'src/utils';
import { ActiveUserError, InvalidCredentialsError, KinveyError } from 'src/errors';
import { CacheRequest } from 'src/request';
import { CacheStore, SyncStore } from 'src/datastore';
import Query from 'src/query';
import expect from 'expect';
import nock from 'nock';
import assign from 'lodash/assign';
import localStorage from 'local-storage';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('User', function() {
  describe('login()', function() {
    beforeEach(function() {
      return User.logout();
    });

    it('should throw an error if an active user already exists', function() {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return UserMock.login(randomString(), randomString());
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

    it('should login a user', function() {
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
        password: password,
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
      return UserMock.logout()
        .then(() => {
          return user.login(username, password);
        })
        .then((user) => {
          expect(user._id).toEqual(reply._id);
          expect(user.authtoken).toEqual(reply._kmd.authtoken);
          expect(user.username).toEqual(reply.username);
          expect(user.data.password).toEqual(undefined);
          expect(user.isActive()).toEqual(true);

          const storedUser = CacheRequest.getActiveUser(this.client);
          expect(storedUser.password).toEqual(undefined);
        });
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
      await UserMock.logout();

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
      await UserMock.logout();

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

  describe('logout()', function() {
    beforeEach(function() {
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
        });
    });

    beforeEach(function() {
      const entity1 = {
        _id: randomString(),
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: '2016-08-17T15:32:01.741Z',
          ect: '2016-08-17T15:32:01.741Z'
        }
      };
      const entity2 = {
        _id: randomString(),
        title: 'Treeflex',
        author: 'Harry Larson',
        isbn: '809087960-8',
        summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: '2016-08-17T15:32:01.744Z',
          ect: '2016-08-17T15:32:01.744Z'
        }
      };

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/foo`)
        .reply(200, [entity1, entity2], {
          'content-type': 'application/json'
        });

      // Pull data into cache
      const store = new CacheStore('foo');
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        });
    });

    afterEach(function() {
      const store = new SyncStore('foo');
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(function() {
      const store = new SyncStore('kinvey_sync');
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(function() {
      const user = localStorage.get(`${this.client.appKey}kinvey_user`);
      expect(user).toEqual(null);
    });

    it('should logout the active user', function() {
      return UserMock.logout()
        .then(() => {
          expect(UserMock.getActiveUser()).toEqual(null);
        });
    });

    it('should logout when there is not an active user', function() {
      return UserMock.logout()
        .then(() => {
          expect(UserMock.getActiveUser()).toEqual(null);
        })
        .then(() => UserMock.logout())
        .then(() => {
          expect(UserMock.getActiveUser()).toEqual(null);
        });
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
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
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
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
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

import { Acl, Metadata, User } from 'src/entity';
import { UserMock } from 'test/mocks';
import { randomString } from 'src/utils';
import { ActiveUserError, InvalidCredentialsError, KinveyError } from 'src/errors';
import { CacheRequest } from 'src/request';
import { CacheStore, SyncStore } from 'src/datastore';
import Client from 'src/client';
import Query from 'src/query';
import expect from 'expect';
import nock from 'nock';
import assign from 'lodash/assign';
import localStorage from 'local-storage';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('User', function() {
  describe('constructor', function() {
    it('should create a user', function() {
      const user = new User();
      expect(user).toBeA(User);
    });

    it('should set data', function() {
      const data = { prop: randomString() };
      const user = new User(data);
      expect(user.data).toEqual(data);
    });

    it('should set the client', function() {
      const client = new Client();
      const user = new User({}, { client: client });
      expect(user.client).toEqual(client);
    });

    it('should set the client to the shared instance if one is not provided', function() {
      const user = new User();
      expect(user.client).toEqual(Client.sharedInstance());
    });
  });

  describe('_id', function() {
    it('should return the _id', function() {
      const data = { _id: randomString() };
      const user = new User(data);
      expect(user._id).toEqual(data._id);
    });
  });

  describe('_acl', function() {
    it('should return the _acl', function() {
      const data = { _acl: { authtoken: randomString() } };
      const user = new User(data);
      expect(user._acl).toEqual(new Acl(data));
    });

    it('should not be able to set the _acl', function() {
      expect(function() {
        const user = new User();
        const data = { _acl: { creator: randomString() } };
        user._acl = new Acl(data);
      }).toThrow();
    });
  });

  describe('metadata', function() {
    it('should return the metadata', function() {
      const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
      const user = new User(data);
      expect(user.metadata).toEqual(new Metadata(data));
    });

    it('should not be able to set the metadata', function() {
      expect(function() {
        const user = new User();
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user.metadata = new Metadata(data);
      }).toThrow();
    });
  });

  describe('_kmd', function() {
    it('should return the metadata', function() {
      const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
      const user = new User(data);
      expect(user._kmd).toEqual(new Metadata(data));
    });

    it('should not be able to set the _kmd', function() {
      expect(function() {
        const user = new User();
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user._kmd = new Metadata(data);
      }).toThrow();
    });
  });

  describe('_socialIdentity', function() {
    it('should return the metadata', function() {
      const data = { _socialIdentity: { kinvey: {} } };
      const user = new User(data);
      expect(user._socialIdentity).toEqual(data._socialIdentity);
    });

    it('should not be able to set the _socialIdentity', function() {
      expect(function() {
        const user = new User();
        const data = { _socialIdentity: { kinvey: {} } };
        user._socialIdentity = data._socialIdentity;
      }).toThrow();
    });
  });

  describe('authtoken', function() {
    it('should return the authtoken', function() {
      const data = { _kmd: { authtoken: randomString() } };
      const user = new User(data);
      expect(user.authtoken).toEqual(new Metadata(data).authtoken);
    });

    it('should not be able to set the authtoken', function() {
      expect(function() {
        const user = new User();
        const data = { _kmd: { authtoken: randomString() } };
        user.authtoken = new Metadata(data).authtoken;
      }).toThrow();
    });
  });

  describe('username', function() {
    it('should return the username', function() {
      const data = { username: randomString() };
      const user = new User(data);
      expect(user.username).toEqual(data.username);
    });

    it('should not be able to set the username', function() {
      expect(function() {
        const user = new User();
        const data = { username: randomString() };
        user.username = data.username;
      }).toThrow();
    });
  });

  describe('email', function() {
    it('should return the email', function() {
      const data = { email: randomString() };
      const user = new User(data);
      expect(user.email).toEqual(data.email);
    });

    it('should not be able to set the email', function() {
      expect(function() {
        const user = new User();
        const data = { email: randomString() };
        user.email = data.email;
      }).toThrow();
    });
  });

  describe('pathname', function() {
    it('should return the pathname', function() {
      const user = new User();
      expect(user.pathname).toEqual(`/user/${user.client.appKey}`);
    });

    it('should not be able to set the pathname', function() {
      expect(function() {
        const user = new User();
        user.pathname = 'user';
      }).toThrow();
    });
  });

  describe('isActive()', function() {
    it('should return true', function() {
      return UserMock.logout()
        .then(() => {
          return UserMock.login('test', 'test');
        })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
        });
    });

    it('should return false', function() {
      const user = new User();
      expect(user.isActive()).toEqual(false);
    });
  });

  describe('isEmailVerified()', function() {
    it('should return true', function() {
      const data = { _kmd: { emailVerification: { status: 'confirmed' } } };
      const user = new User(data);
      expect(user.isEmailVerified()).toEqual(true);
    });

    it('should return false', function() {
      const data = { _kmd: { emailVerification: { status: 'unconfirmed' } } };
      const user = new User(data);
      expect(user.isEmailVerified()).toEqual(false);
    });
  });

  describe('login()', function() {
    beforeEach(function() {
      return UserMock.logout();
    });

    it('should throw an error if an active user already exists', function() {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return User.login(randomString(), randomString());
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
      const user = new User();
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
      const user = new User();
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

    it('should login a user with _socialIdentity', async function() {
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
          expect(User.getActiveUser()).toEqual(null);
        });
    });

    it('should logout when there is not an active user', function() {
      return UserMock.logout()
        .then(() => {
          expect(User.getActiveUser()).toEqual(null);
        })
        .then(() => User.logout())
        .then(() => {
          expect(User.getActiveUser()).toEqual(null);
        });
    });
  });

  describe('signup', function() {
    beforeEach(function() {
      return UserMock.logout();
    });

    it('should signup and set the user as the active user', function() {
      return UserMock.signup({ username: randomString(), password: randomString() })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should signup with a user and set the user as the active user', function() {
      const user = new UserMock({ username: randomString(), password: randomString() });
      return UserMock.signup(user)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should signup user and not set the user as the active user', function() {
      return UserMock.signup({ username: randomString(), password: randomString() }, { state: false })
        .then((user) => {
          expect(user.isActive()).toEqual(false);
          expect(user).toNotEqual(UserMock.getActiveUser());
        });
    });

    it('should signup an implicit user and set the user as the active user', function() {
      return UserMock.signup()
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should merge the signup data and set the user as the active user', function() {
      const user = new UserMock({ username: randomString(), password: randomString() });
      const username = 'foo';
      return user.signup({ username: username })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user.username).toEqual(username);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should throw an error if an active user already exists', function() {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return UserMock.signup({ username: randomString(), password: randomString() });
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should not throw an error with an active user and options.state set to false', function() {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return UserMock.signup({ username: randomString(), password: randomString() }, { state: false });
        })
        .then((user) => {
          expect(user.isActive()).toEqual(false);
          expect(user).toNotEqual(UserMock.getActiveUser());
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
          const requestData = assign(user.data, { email: email });
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
          const requestData = assign(user.data, { email: email });
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

  describe('me()', function() {
    it('should refresh the users data', function() {
      const user = new User({ _id: randomString() });
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(user.client.apiHostname, { encodedQueryParams: true })
        .get(`${user.pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
        });
    });

    it('should remove any sensitive data', function() {
      const user = new User({ _id: randomString() });
      const reply = {
        _id: user._id,
        username: randomString(),
        password: randomString()
      };

      // Kinvey API response
      nock(user.client.apiHostname, { encodedQueryParams: true })
        .get(`${user.pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
          expect(user.data.password).toEqual(null);
        });
    });

    it('should set authtoken if one was not provided and user is active user', function() {
      const activeUser = User.getActiveUser();
      const reply = {
        _id: activeUser._id,
        username: randomString()
      };

      // Kinvey API response
      nock(activeUser.client.apiHostname, { encodedQueryParams: true })
        .get(`${activeUser.pathname}/_me`)
        .reply(200, reply);

      return activeUser.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
          expect(user.authtoken).toEqual(activeUser.authtoken);
        });
    });

    it('should not set authtoken if one was not provided and user is not active user', function() {
      const user = new User({ _id: randomString() });
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(user.client.apiHostname, { encodedQueryParams: true })
        .get(`${user.pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
          expect(user.authtoken).toEqual(null);
        });
    });

    it('should update active user', function() {
      const user = User.getActiveUser();
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(user.client.apiHostname, { encodedQueryParams: true })
        .get(`${user.pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.data).toEqual(User.getActiveUser().data);
        });
    });

    it('should not update active user if not active user', function() {
      const user = new User({ _id: randomString() });
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(user.client.apiHostname, { encodedQueryParams: true })
        .get(`${user.pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.data).toNotEqual(User.getActiveUser().data);
        });
    });
  });

  describe('getActiveUser()', function() {
    it('should return the active user', function() {
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
        })
        .then((user) => {
          expect(UserMock.getActiveUser()).toEqual(user);
        });
    });

    it('should return null', function() {
      return UserMock.logout()
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

  describe('remove()', function() {
    it('should throw a KinveyError if an id is not provided', function() {
      return User.remove()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError if an id is not a string', function() {
      return User.remove(1)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should remove the user that matches the id argument', function() {
      // Remove the user
      const user = new User({ _id: randomString(), email: randomString() });

      nock(this.client.apiHostname)
        .delete(`${user.pathname}/${user._id}`)
        .reply(204);

      return User.remove(user._id)
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should remove the user that matches the id argument permanently', function() {
      // Remove the user
      const user = new User({ _id: randomString(), email: randomString() });

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .delete(`${user.pathname}/${user._id}?hard=true`)
        .reply(204);

      return User.remove(user._id, { hard: true })
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });
  });
});

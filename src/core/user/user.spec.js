import expect from 'expect';
import nock from 'nock';
import assign from 'lodash/assign';
import localStorage from 'local-storage';
import { Acl } from '../acl';
import { Metadata } from '../metadata';
import { User } from './user';
import { randomString } from '../utils';
import { ActiveUserError, InvalidCredentialsError, KinveyError } from '../errors';
import { CacheStore, SyncStore } from '../datastore';
import { Client } from '../client';
import { Query } from '../query';
import { NetworkRack } from '../request';
import { NodeHttpMiddleware } from '../../node/http';
import { init } from '../kinvey';
import { getLiveService } from '../live';

const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('User', () => {
  let client;

  class UserMock extends User {
    static getActiveUser(client) {
      const activeUser = super.getActiveUser(client);

      if (activeUser) {
        return new UserMock(activeUser.data);
      }

      return null;
    }

    login(username, password, options) {
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

      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${this.pathname}/login`, { username: username, password: password })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Login
      return super.login(username, password, options);
    }

    static login(username, password, options) {
      const user = new UserMock({}, options);
      return user.login(username, password, options);
    }

    loginWithMIC(redirectUri, authorizationGrant, options) {
      return super.logout(options)
        .then(() => {
          const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
          const code = randomString();
          const token = {
            access_token: randomString(),
            token_type: 'bearer',
            expires_in: 3599,
            refresh_token: randomString()
          };

          // API Response
          nock(this.client.micHostname, { encodedQueryParams: true })
            .post(
            '/oauth/auth',
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
            )
            .reply(200, {
              temp_login_uri: tempLoginUriParts.href
            });

          nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
            .post(
            tempLoginUriParts.pathname,
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${options.username}&password=${options.password}`
            )
            .reply(302, null, {
              Location: `${redirectUri}/?code=${code}`
            });

          nock(this.client.micHostname, { encodedQueryParams: true })
            .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
            )
            .reply(200, token);

          nock(this.client.apiHostname, { encodedQueryParams: true })
            .post(`${this.pathname}/login`, { _socialIdentity: { kinveyAuth: token } })
            .reply(200, {
              _id: randomString(),
              _kmd: {
                lmt: new Date().toISOString(),
                ect: new Date().toISOString(),
                authtoken: randomString()
              },
              _acl: {
                creator: randomString()
              },
              _socialIdentity: {
                kinveyAuth: token
              }
            });

          return super.loginWithMIC(redirectUri, authorizationGrant, options);
        });
    }

    logout(options) {
      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`${this.pathname}/_logout`)
        .reply(204);

      // Logout
      return super.logout(options);
    }

    static logout(options = {}) {
      const user = UserMock.getActiveUser(options.client);

      if (user) {
        return user.logout(options);
      }

      return Promise.resolve(null);
    }

    signup(data, options) {
      let userData = data;

      if (userData instanceof User) {
        userData = data.data;
      }

      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        username: userData ? userData.username : undefined,
        _acl: {
          creator: randomString()
        }
      };

      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(this.pathname, () => true)
        .reply(201, reply);

      return super.signup(data, options);
    }

    static signup(data, options) {
      const user = new UserMock({}, options);
      return user.signup(data, options);
    }
  }

  before(() => {
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });


  describe('constructor', () => {
    it('should create a user', () => {
      const user = new User();
      expect(user).toBeA(User);
    });

    it('should set data', () => {
      const data = { prop: randomString() };
      const user = new User(data);
      expect(user.data).toEqual(data);
    });

    it('should set the client', () => {
      const client = new Client();
      const user = new User({}, { client: client });
      expect(user.client).toEqual(client);
    });

    it('should set the client to the shared instance if one is not provided', () => {
      const user = new User();
      expect(user.client).toEqual(Client.sharedInstance());
    });
  });

  describe('_id', () => {
    it('should return the _id', () => {
      const data = { _id: randomString() };
      const user = new User(data);
      expect(user._id).toEqual(data._id);
    });
  });

  describe('_acl', () => {
    it('should return the _acl', () => {
      const data = { _acl: { authtoken: randomString() } };
      const user = new User(data);
      expect(user._acl).toEqual(new Acl(data));
    });

    it('should not be able to set the _acl', () => {
      expect(() => {
        const user = new User();
        const acl = user._acl;
        const data = { _acl: { creator: randomString() } };
        user._acl = new Acl(data);
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('metadata', () => {
    it('should return the metadata', () => {
      const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
      const user = new User(data);
      expect(user.metadata).toEqual(new Metadata(data));
    });

    it('should not be able to set the metadata', () => {
      expect(() => {
        const user = new User();
        const metadata = user.metadata;
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user.metadata = new Metadata(data);
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('_kmd', () => {
    it('should return the metadata', () => {
      const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
      const user = new User(data);
      expect(user._kmd).toEqual(new Metadata(data));
    });

    it('should not be able to set the _kmd', () => {
      expect(() => {
        const user = new User();
        const kmd = user._kmd;
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user._kmd = new Metadata(data);
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('_socialIdentity', () => {
    it('should return the metadata', () => {
      const data = { _socialIdentity: { kinvey: {} } };
      const user = new User(data);
      expect(user._socialIdentity).toEqual(data._socialIdentity);
    });

    it('should not be able to set the _socialIdentity', () => {
      expect(() => {
        const user = new User();
        const socialIdentity = user._socialIdentity;
        const data = { _socialIdentity: { kinvey: {} } };
        user._socialIdentity = data._socialIdentity;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('authtoken', () => {
    it('should return the authtoken', () => {
      const data = { _kmd: { authtoken: randomString() } };
      const user = new User(data);
      expect(user.authtoken).toEqual(new Metadata(data).authtoken);
    });

    it('should not be able to set the authtoken', () => {
      expect(() => {
        const user = new User();
        const authtoken = user.authtoken;
        const data = { _kmd: { authtoken: randomString() } };
        user.authtoken = new Metadata(data).authtoken;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('username', () => {
    it('should return the username', () => {
      const data = { username: randomString() };
      const user = new User(data);
      expect(user.username).toEqual(data.username);
    });

    it('should not be able to set the username', () => {
      expect(() => {
        const user = new User();
        const username = user.username;
        const data = { username: randomString() };
        user.username = data.username;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('email', () => {
    it('should return the email', () => {
      const data = { email: randomString() };
      const user = new User(data);
      expect(user.email).toEqual(data.email);
    });

    it('should not be able to set the email', () => {
      expect(() => {
        const user = new User();
        const email = user.email;
        const data = { email: randomString() };
        user.email = data.email;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('pathname', () => {
    it('should return the pathname', () => {
      const user = new User();
      expect(user.pathname).toEqual(`/user/${user.client.appKey}`);
    });

    it('should not be able to set the pathname', () => {
      expect(() => {
        const user = new User();
        user.pathname = 'user';
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('isActive()', () => {
    it('should return true', () => {
      return UserMock.logout()
        .then(() => {
          return UserMock.login('test', 'test');
        })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
        });
    });

    it('should return false', () => {
      const user = new User();
      expect(user.isActive()).toEqual(false);
    });
  });

  describe('isEmailVerified()', () => {
    it('should return true', () => {
      const data = { _kmd: { emailVerification: { status: 'confirmed' } } };
      const user = new User(data);
      expect(user.isEmailVerified()).toEqual(true);
    });

    it('should return false', () => {
      const data = { _kmd: { emailVerification: { status: 'unconfirmed' } } };
      const user = new User(data);
      expect(user.isEmailVerified()).toEqual(false);
    });
  });

  describe('login()', () => {
    beforeEach(() => {
      return UserMock.logout();
    });

    it('should throw an error if an active user already exists', () => {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return User.login(randomString(), randomString());
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should throw an error if a username is not provided', async () => {
      try {
        await User.login(null, randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username is an empty string', async () => {
      try {
        await User.login(' ', randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if a password is not provided', async () => {
      try {
        await User.login(randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the password is an empty string', async () => {
      try {
        await User.login(randomString(), ' ');
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username and/or password is invalid', () => {
      const user = new User();
      const username = randomString();
      const password = randomString();

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
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

    it('should login a user', () => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
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

          const storedUser = client.getActiveUser();
          expect(storedUser.password).toEqual(undefined);
        });
    });

    it('should login a user by providing credentials as an object', async () => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
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

    it('should login a user with _socialIdentity', async () => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
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

  describe('logout()', () => {
    beforeEach(() => {
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
        });
    });

    beforeEach(() => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/foo`)
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

    afterEach(() => {
      const store = new SyncStore('foo');
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(() => {
      const store = new SyncStore('kinvey_sync');
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(() => {
      const user = localStorage.get(`${client.appKey}kinvey_user`);
      expect(user).toEqual(null);
    });

    it('should logout the active user', () => {
      return UserMock.logout()
        .then(() => {
          expect(User.getActiveUser()).toEqual(null);
        });
    });

    it('should logout when there is not an active user', () => {
      return UserMock.logout()
        .then(() => {
          expect(User.getActiveUser()).toEqual(null);
        })
        .then(() => User.logout())
        .then(() => {
          expect(User.getActiveUser()).toEqual(null);
        });
    });

    it('should unregister user from Live Service', () => {
      const activeUser = User.getActiveUser();
      const spy = expect.spyOn(activeUser, 'unregisterFromLiveService')
        .andReturn(Promise.resolve());

      return activeUser.logout()
        .then(() => {
          expect(spy).toHaveBeenCalled();
          expect.restoreSpies();
        });
    });
  });

  describe.skip('live service registration management', () => {
    let activeUser;
    let liveService;

    beforeEach(() => {
      activeUser = User.getActiveUser();
      liveService = getLiveService(Client.sharedInstance());
    });

    afterEach(() => expect.restoreSpies());

    describe('registerForLiveService', () => {
      it('should do nothing, if already registered', () => {
        const spy = expect.spyOn(liveService, 'fullInitialization');
        expect.spyOn(liveService, 'isInitialized')
          .andReturn(true);

        return activeUser.registerForLiveService()
          .then(() => {
            expect(spy).toNotHaveBeenCalled();
          });
      });

      it('should call LiveService\'s fullInitialization() method, if not registered', () => {
        const spy = expect.spyOn(liveService, 'fullInitialization')
          .andReturn(Promise.resolve());
        expect.spyOn(liveService, 'isInitialized')
          .andReturn(false);

        return activeUser.registerForLiveService()
          .then(() => {
            expect(spy).toHaveBeenCalledWith(activeUser);
          });
      });
    });

    describe('unregisterFromLiveService', () => {
      let activeUser;
      let liveService;

      beforeEach(() => {
        activeUser = User.getActiveUser();
        liveService = getLiveService(Client.sharedInstance());
      });

      it('should do nothing, if not registered', () => {
        const spy = expect.spyOn(liveService, 'fullUninitialization');
        expect.spyOn(liveService, 'isInitialized')
          .andReturn(false);

        return activeUser.unregisterFromLiveService()
          .then(() => {
            expect(spy).toNotHaveBeenCalled();
          });
      });

      it('should call LiveService\'s fullUninitialization() method, if registered', () => {
        const spy = expect.spyOn(liveService, 'fullUninitialization')
          .andReturn(Promise.resolve());
        expect.spyOn(liveService, 'isInitialized')
          .andReturn(true);

        return activeUser.unregisterFromLiveService()
          .then(() => {
            expect(spy).toHaveBeenCalled();
          });
      });
    });
  });

  describe('signup', () => {
    beforeEach(() => {
      return UserMock.logout();
    });

    it('should signup and set the user as the active user', () => {
      return UserMock.signup({ username: randomString(), password: randomString() })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should signup with a user and set the user as the active user', () => {
      const user = new UserMock({ username: randomString(), password: randomString() });
      return UserMock.signup(user)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should signup user and not set the user as the active user', () => {
      return UserMock.signup({ username: randomString(), password: randomString() }, { state: false })
        .then((user) => {
          expect(user.isActive()).toEqual(false);
          expect(user).toNotEqual(UserMock.getActiveUser());
        });
    });

    it('should signup an implicit user and set the user as the active user', () => {
      return UserMock.signup()
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should merge the signup data and set the user as the active user', () => {
      const user = new UserMock({ username: randomString(), password: randomString() });
      const username = 'foo';
      return user.signup({ username: username })
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user.username).toEqual(username);
          expect(user).toEqual(UserMock.getActiveUser());
        });
    });

    it('should throw an error if an active user already exists', () => {
      return UserMock.login(randomString(), randomString())
        .then(() => {
          return UserMock.signup({ username: randomString(), password: randomString() });
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should not throw an error with an active user and options.state set to false', () => {
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

  describe('update()', () => {
    it('should throw an error if the user does not have an _id', () => {
      const user = new User({ email: randomString() });
      return user.update({ email: randomString })
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('User must have an _id.');
        });
    });

    it('should update the active user', () => {
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
        })
        .then((user) => {
          const email = randomString();
          const requestData = assign(user.data, { email: email });
          const responseData = assign(requestData, { _kmd: { authtoken: randomString() } });

          // Kinvey API response
          nock(client.apiHostname, { encodedQueryParams: true })
            .put(`${user.pathname}/${user._id}`, requestData)
            .reply(200, responseData);

          return user.update({ email: email })
            .then(() => {
              const activeUser = User.getActiveUser();
              expect(activeUser.data).toEqual(responseData);
            });
        });
    });

    it('should update a user and not the active user', () => {
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
          nock(client.apiHostname, { encodedQueryParams: true })
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

  describe('me()', () => {
    it('should refresh the users data', () => {
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

    it('should remove any sensitive data', () => {
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

    it('should set authtoken if one was not provided and user is active user', () => {
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

    it('should not set authtoken if one was not provided and user is not active user', () => {
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

    it('should update active user', () => {
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

    it('should not update active user if not active user', () => {
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

  describe('getActiveUser()', () => {
    it('should return the active user', () => {
      return UserMock.logout()
        .then(() => {
          return UserMock.login(randomString(), randomString());
        })
        .then((user) => {
          expect(UserMock.getActiveUser()).toEqual(user);
        });
    });

    it('should return null', () => {
      return UserMock.logout()
        .then(() => {
          expect(UserMock.getActiveUser()).toEqual(null);
        });
    });
  });

  describe('verifyEmail()', () => {
    it('should throw an error if a username is not provided', async () => {
      try {
        await User.verifyEmail();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async () => {
      try {
        await User.verifyEmail({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should verify an email for a user', async () => {
      const username = 'test';

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${client.appKey}/${username}/user-email-verification-initiate`)
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.verifyEmail(username);
      expect(response).toEqual({});
    });
  });

  describe('forgotUsername()', () => {
    it('should throw an error if an email is not provided', async () => {
      try {
        await User.forgotUsername();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided email is not a string', async () => {
      try {
        await User.forgotUsername({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should retrieve a username for a user', async () => {
      const email = 'test@test.com';

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${client.appKey}/user-forgot-username`, { email: email })
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.forgotUsername(email);
      expect(response).toEqual({});
    });
  });

  describe('resetPassword()', () => {
    it('should throw an error if a username is not provided', async () => {
      try {
        await User.resetPassword();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async () => {
      try {
        await User.resetPassword({});
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should reset the password for a user', async () => {
      const username = 'test';

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/${rpcNamespace}/${client.appKey}/${username}/user-password-reset-initiate`)
        .reply(200, {}, {
          'content-type': 'application/json; charset=utf-8'
        });

      const response = await User.resetPassword(username);
      expect(response).toEqual({});
    });
  });

  describe('lookup()', () => {
    before(() => {
      return UserMock.login(randomString(), randomString());
    });

    it('should throw an error if the query argument is not an instance of the Query class', () => {
      return User.lookup({}, { discover: true })
        .toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should return an array of users', () => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${client.appKey}/_lookup`)
        .reply(200, USERS);

      return User.lookup()
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);
        });
    });

    it('should return an array of users matching the query', () => {
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
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${client.appKey}/_lookup`, query.toPlainObject().filter)
        .reply(200, USERS);

      return User.lookup(query)
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);

          users.forEach(function (user) {
            expect(user.username).toEqual('foo');
          });
        });
    });
  });

  describe('remove()', () => {
    before(() => {
      nock.cleanAll();
    });

    it('should throw a KinveyError if an id is not provided', () => {
      return User.remove()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError if an id is not a string', () => {
      return User.remove(1)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should remove the user that matches the id argument', () => {
      // Remove the user
      const user = new User({ _id: randomString(), email: randomString() });

      nock(client.apiHostname)
        .delete(`${user.pathname}/${user._id}`)
        .reply(204);

      return User.remove(user._id)
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });

    it('should remove the user that matches the id argument permanently', () => {
      // Remove the user
      const user = new User({ _id: randomString(), email: randomString() });

      nock(client.apiHostname, { encodedQueryParams: true })
        .delete(`${user.pathname}/${user._id}`)
        .query({ hard: true })
        .reply(204);

      return User.remove(user._id, { hard: true })
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });
  });
});

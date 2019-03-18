import expect from 'expect';
import chai from 'chai';
import nock from 'nock';
import { throwError } from 'rxjs';
import assign from 'lodash/assign';
import url from 'url';
import Acl from '../acl';
import Kmd from '../kmd';
import ActiveUserError from '../errors/activeUser';
import InvalidCredentialsError from '../errors/invalidCredentials';
import KinveyError from '../errors/kinvey';
import { collection, DataStoreType } from '../datastore';
import Query from '../query';
import init from '../kinvey/init';
import { get as getConfig } from '../kinvey/config';
// import { getLiveService } from 'kinvey-live';
import User from './user';
import getActiveUser from './getActiveUser';
import login from './login';
import restore from './restore';
import signupWithIdentity from './signupWithIdentity';
import remove from './remove';
import lookup from './lookup';
import resetPassword from './resetPassword';
import forgotUsername from './forgotUsername';
import verifyEmail from './verifyEmail';
import logout from './logout';
import AuthorizationGrant from './authorizationGrant';
import signup from './signup';

chai.use(require('chai-as-promised'));

const rpcNamespace = 'rpc';
const USER_NAMESPACE = 'user';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

class UserMock extends User {
  static getActiveUser() {
    const activeUser = getActiveUser();

    if (activeUser) {
      return new UserMock(activeUser.data);
    }

    return null;
  }

  static login(username, password, options) {
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username,
      _acl: {
        creator: randomString()
      }
    };

    // Setup nock response
    const { apiHostname, appKey } = getConfig();
    nock(apiHostname, { encodedQueryParams: true })
      .post(`/${USER_NAMESPACE}/${appKey}/login`, { username, password })
      .reply(200, reply, {
        'content-type': 'application/json; charset=utf-8'
      });

    // Login
    return login(username, password, options);
  }

  loginWithMIC(redirectUri, authorizationGrant, options) {
    const { micHostname, apiHostname, appKey } = getConfig();
    return super.logout(options)
      .then(() => {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const clientId = appKey;
        const username = options.username || randomString();
        const password = options.password || randomString();
        const code = randomString();
        const token = {
          access_token: randomString(),
          token_type: 'bearer',
          expires_in: 3599,
          refresh_token: randomString(),
          identity: 'kinveyAuth',
          clientId,
          redirectUri,
          protocol: 'https:',
          host: 'auth.kinvey.com'
        };

        // API Response
        nock(micHostname)
          .post(
            '/v3/oauth/auth',
            `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`)
          .post(
            tempLoginUriParts.pathname,
            `client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
          )
          .reply(302, null, {
            Location: `${redirectUri}/?code=${code}`
          });

        nock(micHostname)
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token);

        nock(apiHostname)
          .post(`/${USER_NAMESPACE}/${appKey}/login`)
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

        return super.loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, { username, password });
      });
  }

  logout(options) {
    const { apiHostname, appKey } = getConfig();

    // Setup nock response
    nock(apiHostname, { encodedQueryParams: true })
      .post(`/${USER_NAMESPACE}/${appKey}/_logout`)
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

  static signup(data, options) {
    const { apiHostname, appKey } = getConfig();
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
    nock(apiHostname, { encodedQueryParams: true })
      .post(`/${USER_NAMESPACE}/${appKey}`, () => true)
      .reply(201, reply);

    // Signup
    return signup(data, options);
  }
}

describe('User', () => {
  let client;

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
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
      expect(user.metadata).toEqual(new Kmd(data));
    });

    it('should not be able to set the metadata', () => {
      expect(() => {
        const user = new User();
        const metadata = user.metadata;
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user.metadata = new Kmd(data);
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('_kmd', () => {
    it('should return the metadata', () => {
      const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
      const user = new User(data);
      expect(user._kmd).toEqual(new Kmd(data));
    });

    it('should not be able to set the _kmd', () => {
      expect(() => {
        const user = new User();
        const kmd = user._kmd;
        const data = { _kmd: { lmt: new Date().toISOString(), ect: new Date().toISOString() } };
        user._kmd = new Kmd(data);
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
      expect(user.authtoken).toEqual(new Kmd(data).authtoken);
    });

    it('should not be able to set the authtoken', () => {
      expect(() => {
        const user = new User();
        const authtoken = user.authtoken;
        const data = { _kmd: { authtoken: randomString() } };
        user.authtoken = new Kmd(data).authtoken;
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

  describe('pathname', () => {//TODO: no pathname getter
    it('should return the pathname', () => {
      const user = new User();
      expect(user.pathname).toEqual(`/user/${client.appKey}`);
    });

    it('should not be able to set the pathname', () => {
      expect(() => {
        const user = new User();
        user.pathname = 'user';
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('isActive()', () => {// TODO: Reworked user-mock to work without client of the user
    it('should return true', () => {
      return UserMock.logout(client.appKey)
        .then(() => {
          return UserMock.login('test', 'test', client.appKey);
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
      return UserMock.logout(client.appKey);
    });

    it('should throw an error if an active user already exists', () => {
      return UserMock.login(randomString(), randomString(), client.appKey)
        .then(() => {
          return login(randomString(), randomString(), client.appKey);
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should throw an error if a username is not provided', async () => {
      try {
        await login(null, randomString(), client.appKey);
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username is an empty string', async () => {
      try {
        await login(' ', randomString(), client.appKey);
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if a password is not provided', async () => {
      try {
        await login(randomString());
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the password is an empty string', async () => {
      try {
        await login(randomString(), ' ', client.appKey);
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the username and/or password is invalid', () => {
      const user = new User();
      const username = randomString();
      const password = randomString();
      const pathname = `/user/${client.appKey}`

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`${pathname}/login`, { username: username, password: password })
        .reply(401, {
          name: 'InvalidCredentials',
          message: 'Invalid credentials. Please retry your request with correct credentials'
        }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

      return login(username, password)
        .catch((error) => {
          expect(error).toBeA(InvalidCredentialsError);
        });
    });

    it('should login a user', () => {
      const user = new User();
      const username = randomString();
      const password = randomString();
      const pathname = `/user/${client.appKey}`;

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
        .post(`${pathname}/login`, { username: username, password: password })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      return UserMock.logout(client.appKey)
        .then(() => {
          return login(username, password);
        })
        .then((user) => {
          expect(user._id).toEqual(reply._id);
          expect(user._kmd.authtoken).toEqual(reply._kmd.authtoken);
          expect(user.username).toEqual(reply.username);
          expect(user.data.password).toEqual(undefined);
          expect(user.isActive()).toEqual(true);

          const storedUser = getActiveUser();
          expect(storedUser.password).toEqual(undefined);
        });
    });

    it('should login a user by providing credentials as an object', async () => {
      let user = new User();
      const username = randomString();
      const password = randomString();
      const pathname = `/user/${client.appKey}`;
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
        .post(`${pathname}/login`, { username: username, password: password })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      await UserMock.logout(client.appKey);

      // Login
      user = await login({
        username: username,
        password: password
      });

      // Expectations
      expect(user._id).toEqual(reply._id);
      expect(user._kmd.authtoken).toEqual(reply._kmd.authtoken);
      expect(user.username).toEqual(reply.username);

      const isActive = await user.isActive();
      expect(isActive).toEqual(true);
    });

    it('should login a user with _socialIdentity', async () => {
      const socialIdentity = { foo: { baz: randomString() }, faa: randomString() };
      let user = new User();
      const pathname = `/user/${client.appKey}`;
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
        .post(`${pathname}/login`, { _socialIdentity: socialIdentity })
        .reply(200, reply, {
          'content-type': 'application/json; charset=utf-8'
        });

      // Logout the test user
      await UserMock.logout(client.appKey);

      // Login
      user = await login({
        _socialIdentity: socialIdentity
      });

      // Expectations
      expect(user._id).toEqual(reply._id);
      expect(user._kmd.authtoken).toEqual(reply._kmd.authtoken);
      expect(user.username).toEqual(reply.username);
      expect(user.data._socialIdentity.foo.baz).toEqual(socialIdentity.foo.baz);
      expect(user.data._socialIdentity.foo.bar).toEqual(reply._socialIdentity.foo.bar);
      expect(user.data._socialIdentity.faa).toEqual(socialIdentity.faa);

      const isActive = user.isActive();
      expect(isActive).toEqual(true);
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      return UserMock.logout(client.appKey)
        .then(() => {
          return UserMock.login(randomString(), randomString(), client.appKey);
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
      const store = collection('foo');
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(2);
        });
    });

    afterEach(() => {
      const store = collection('foo', DataStoreType.Sync);
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(() => {
      const store = collection('kinvey_sync', DataStoreType.Sync);
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    afterEach(() => {
      const user = getActiveUser();
      expect(user).toEqual(null);
    });

    it('should logout the active user', () => {
      return UserMock.logout(client.appKey)
        .then(() => {
          expect(getActiveUser()).toEqual(null);
        });
    });

    it('should logout when there is not an active user', () => {
      return UserMock.logout(client.appKey)
        .then(() => {
          expect(getActiveUser()).toEqual(null);
        })
        .then(() => logout(client.appKey))
        .then(() => {
          expect(getActiveUser()).toEqual(null);
        });
    });

    it.skip('should unregister user from Live Service', () => {//TODO: logout seems to no unregister user from live services
      const activeUser = getActiveUser();
      const spy = expect.spyOn(activeUser, 'unregisterFromLiveService')
        .andReturn(Promise.resolve());

      return logout(client.appKey)
        .then(() => {
          expect(spy).toHaveBeenCalled();
          expect.restoreSpies();
        });
    });
  });

  describe.skip('live service registration management', () => {//TODO - rework along with the other live services tests
    let activeUser;
    let liveService;

    before(() => {
      return UserMock.login(randomString(), randomString(), client.appKey);
    });

    beforeEach(() => {
      activeUser = getActiveUser();
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

    describe('unregisterFromLiveService', () => {//TODO: Obsolete?
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
      return UserMock.logout(client.appKey);
    });

    it('should signup and set the user as the active user', () => {
      return UserMock.signup({ username: randomString(), password: randomString() }, {}, client.appKey)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(getActiveUser());
        });
    });

    it('should signup with a user and set the user as the active user', () => {
      const user = new UserMock({ username: randomString(), password: randomString() });
      return UserMock.signup(user, {}, client.appKey)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(getActiveUser());
        });
    });

    it('should signup user and not set the user as the active user', () => {
      return UserMock.signup({ username: randomString(), password: randomString() }, { state: false }, client.appKey)
        .then((user) => {
          expect(user.isActive()).toEqual(false);
          expect(getActiveUser()).toEqual(null);
        });
    });

    it('should signup an implicit user and set the user as the active user', () => {
      return UserMock.signup(null, {}, client.appKey)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user).toEqual(getActiveUser());
        });
    });

    it.skip('should merge the signup data and set the user as the active user', () => {
      const user = new UserMock({ username: randomString(), password: randomString() });
      const username = 'foo';
      return user.signup({ username: username }, {}, client.appKey)
        .then((user) => {
          expect(user.isActive()).toEqual(true);
          expect(user.username).toEqual(username);
          expect(user).toEqual(getActiveUser());
        });
    });

    it('should throw an error if an active user already exists', () => {
      return UserMock.login(randomString(), randomString(), client.appKey)
        .then(() => {
          return UserMock.signup({ username: randomString(), password: randomString() }, {}, client.appKey);
        })
        .catch((error) => {
          expect(error).toBeA(ActiveUserError);
        });
    });

    it('should not throw an error with an active user and options.state set to false', () => {
      return UserMock.login(randomString(), randomString(), client.appKey)
        .then(() => {
          return UserMock.signup({ username: randomString(), password: randomString() }, { state: false }, client.appKey);
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
      return user.update({ email: randomString() })
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('User must have an _id.');
        });
    });

    it('should update the active user', () => {
      const pathname = `/user/${client.appKey}`;
      return UserMock.logout(client.appKey)
        .then(() => {
          return UserMock.login(randomString(), randomString(), client.appKey);
        })
        .then((user) => {
          const email = randomString();
          const requestData = assign(user.data, { email: email });
          const responseData = assign(requestData, { _kmd: { authtoken: randomString() } });

          // Kinvey API response
          nock(client.apiHostname)
            .put(`${pathname}/${user._id}`, requestData)
            .reply(200, responseData);

          return user.update({ email: email })
            .then((resultingUser) => {
              expect(resultingUser.data).toEqual(responseData);
              const activeUser = getActiveUser();
              expect(activeUser.data).toEqual(responseData);
            });
        });
    });

    it('should update a user and not the active user', () => {
      const pathname = `/user/${client.appKey}`;
      return UserMock.logout(client.appKey)
        .then(() => {
          return UserMock.login(randomString(), randomString(), client.appKey);
        })
        .then((activeUser) => {
          const user = new User({ _id: randomString(), email: randomString() });
          const email = randomString();
          const requestData = assign(user.data, { email: email });
          const responseData = assign(requestData, { _kmd: { authtoken: randomString() } });

          // Kinvey API response
          nock(client.apiHostname, { encodedQueryParams: true })
            .put(`${pathname}/${user._id}`, requestData)
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
    beforeEach('login a user', () => {
      const username = randomString();
      const password = randomString();
      return UserMock.login(username, password, client.appKey)
        .then((user) => {
          const activeUser = getActiveUser();
          expect(activeUser.username).toEqual(username);
        })
        .catch((err) => { throwError(err) })
    });

    it('should refresh the users data', () => {
      const pathname = `/user/${client.appKey}`;
      const user = new User({ _id: randomString(), name: randomString() });
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`${pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
          expect(user.data.name).toEqual(undefined);
        });
    });

    it('should remove any sensitive data', () => {
      const pathname = `/user/${client.appKey}`;
      const user = new User({ _id: randomString() });
      const reply = {
        _id: user._id,
        username: randomString(),
        password: randomString()
      };

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`${pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.username).toEqual(reply.username);
          expect(user.data.password).toEqual(null);
        });
    });

    it('should update active user', () => {
      const pathname = `/user/${client.appKey}`;
      const user = getActiveUser();
      const reply = {
        _id: user._id,
        username: randomString()
      };

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`${pathname}/_me`)
        .reply(200, reply);

      return user.me()
        .then((user) => {
          expect(user.data).toEqual(getActiveUser().data);
        });
    });

    it('should fail for a user that is not active', () => {
      const user = new User();
      return chai.expect(user.me()).to.eventually.be.rejected;
    });
  });

  describe('getActiveUser()', () => {
    it('should return the active user', () => {
      return UserMock.logout(client.appKey)
        .then(() => {
          return UserMock.login(randomString(), randomString(), client.appKey);
        })
        .then((user) => {
          expect(getActiveUser()).toEqual(user);
        });
    });

    it('should return null with no active user', () => {
      return UserMock.logout(client.appKey)
        .then(() => {
          expect(getActiveUser()).toEqual(null);
        });
    });
  });

  describe('verifyEmail()', () => {
    it('should throw an error if a username is not provided', async () => {
      try {
        await verifyEmail();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async () => {
      try {
        await verifyEmail({});
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

      const response = await verifyEmail(username);
      expect(response).toEqual({});
    });
  });

  describe('forgotUsername()', () => {
    it('should throw an error if an email is not provided', async () => {
      try {
        await forgotUsername();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided email is not a string', async () => {
      try {
        await forgotUsername({});
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

      const response = await forgotUsername(email);
      expect(response).toEqual({});
    });
  });

  describe('resetPassword()', () => {
    it('should throw an error if a username is not provided', async () => {
      try {
        await resetPassword();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should throw an error if the provided username is not a string', async () => {
      try {
        await resetPassword({});
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

      const response = await resetPassword(username);
      expect(response).toEqual({});
    });
  });

  describe('lookup()', () => {
    before(() => {
      return UserMock.login(randomString(), randomString(), client.appKey);
    });

    it('should throw an error if the query argument is not an instance of the Query class', () => {
      return lookup({}, { discover: true })
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

      return lookup()
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

      return lookup(query)
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
      return remove()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError if an id is not a string', () => {
      return remove(1)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should remove the user that matches the id argument', () => {
      const pathname = `/user/${client.appKey}`;
      const user = new User({ _id: randomString(), email: randomString() });

      nock(client.apiHostname)
        .delete(`${pathname}/${user._id}`)
        .reply(204);

      return remove(user._id)
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });

    it.skip('should use the proper credentials when removing a user a second time', () => {
      const pathname = `/user/${client.appKey}`;
      const user = new User({ _id: randomString(), email: randomString() });

      const b = nock(client.apiHostname, {
        reqheaders: {
          'Authorization': /fff/
        }
      })
        .delete(`${pathname}/${user._id}`)
        .reply(204);

      // var a = nock(client.apiHostname, {reqheaders:{'Authorization':/Kinvey/}})
      //   .delete(`${pathname}/${user._id}`)
      //   .reply(204);

      return remove(user._id)
        .then(() => {
          remove(user._id)
            .then(() => {
              //expect(a.isDone()).toEqual(true);
            })
            .catch((err) => {
              //console.log(a.isDone())
              throw new Error(err)
            })
        })
    });

    it('should remove the user that matches the id argument permanently', () => {
      const pathname = `/user/${client.appKey}`;
      const user = new User({ _id: randomString(), email: randomString() });

      nock(client.apiHostname, { encodedQueryParams: true })
        .delete(`${pathname}/${user._id}`)
        .query({ hard: true })
        .reply(204);

      return remove(user._id, { hard: true })
        .then(() => {
          expect(nock.isDone()).toEqual(true);
        });
    });
  });

  describe('restore()', () => {

    it('should return error', () => {
      return restore()
        .catch((err) => {
          expect(err.message).toEqual('This function requires a master secret to be provided for your application. We strongly advise not to do this.');
        })
    })
  })

  describe('signUpWithIdentity()', () => {

    it('should return error', () => {
      return signupWithIdentity({})
        .catch((err) => {
          expect(err.message).toEqual('This function has been deprecated. You should use MIC to login instead.');
        })
    })
  })
});

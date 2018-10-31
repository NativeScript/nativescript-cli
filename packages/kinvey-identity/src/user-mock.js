import nock from 'nock';
import { randomString } from 'kinvey-test-utils';
import { User } from './user';
import * as userFuncs from './user';
var apiHostname = "https://baas.kinvey.com";
var micHostname =  "https://auth.kinvey.com";

/**
 * @private
 */
export class UserMock extends User {
  static getActiveUser() {
    const activeUser = userFuncs.getActiveUser();

    if (activeUser) {
      return new UserMock(activeUser);
    }

    return null;
  }

  pathname(appKey) {
    return `/user/${appKey}`;
  }

  login(username, password, appKey) {
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
    nock(apiHostname, { encodedQueryParams: true })
      .post(`${`/user/${appKey}`}/login`, { username: username, password: password })
      .reply(200, reply, {
        'content-type': 'application/json; charset=utf-8'
      });
    // Login
    return userFuncs.login(username, password, appKey);
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
        nock(micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${options.username}&password=${options.password}`
          )
          .reply(302, null, {
            Location: `${redirectUri}/?code=${code}`
          });

        nock(micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token);

        nock(apiHostname, { encodedQueryParams: true })
          .post(`${pathname}/login`, { _socialIdentity: { kinveyAuth: token } })
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

  logout(appKey) {
    // Setup nock response
    nock(apiHostname, { encodedQueryParams: true })
      .post(`${getPathname(appKey)}/_logout`)
      .reply(204);

    // Logout
    return super.logout();
  }

  static logout(appKey) {
    const user = UserMock.getActiveUser();

    if (user) {
      return userFuncs.logout();
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
    nock(apiHostname, { encodedQueryParams: true })
      .post(pathname, () => true)
      .reply(201, reply);

    return super.signup(data, options);
  }

  static signup(data, options) {
    const user = new UserMock({}, options);
    return user.signup(data, options);
  }
}

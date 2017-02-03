import { User } from 'src/entity';
import { randomString } from 'src/utils';
import nock from 'nock';
import url from 'url';

export default class TestUser extends User {
  static getActiveUser(client) {
    const activeUser = super.getActiveUser(client);

    if (activeUser) {
      return new TestUser(activeUser.data);
    }

    return Promise.resolve(null);
  }

  login(username, password, options) {
    return super.logout(options)
      .then(() => {
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
      });
  }

  static login(username, password, options) {
    const user = new TestUser({}, options);
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

  static logout(options) {
    const user = new TestUser({}, options);
    return user.logout(options);
  }
}

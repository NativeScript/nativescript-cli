import { MobileIdentityConnect, AuthorizationGrant } from 'src/identity';
import { InsufficientCredentialsError, MobileIdentityConnectError } from 'src/errors';
import Client from 'src/client';
import { randomString } from 'src/utils';
import assign from 'lodash/assign';
import expect from 'expect';
import nock from 'nock';
import url from 'url';
const redirectUri = 'http://localhost:3000';

describe('MobileIdentityConnect', function() {
  // Get the shared client instance
  before(function() {
    this.client = Client.sharedInstance();
  });

  // Cleanup
  after(function() {
    delete this.client;
  });

  describe('identity', function() {
    it('should return MobileIdentityConnect', function() {
      expect(MobileIdentityConnect.identity).toEqual('kinveyAuth');
      expect(new MobileIdentityConnect().identity).toEqual('kinveyAuth');
    });
  });

  describe('isSupported()', function() {
    it('should return true', function() {
      expect(MobileIdentityConnect.isSupported()).toEqual(true);
      expect(new MobileIdentityConnect().isSupported()).toEqual(true);
    });
  });

  describe('login()', function() {
    describe('AuthorizationGrant.AuthorizationCodeAPI', function() {
      it('should fail with invalid credentials', function() {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(this.client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(401, {
            error: 'access_denied',
            error_description: 'The resource owner or authorization server denied the request.',
            debug: 'Authentication failed for undefined'
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .catch((error) => {
            expect(error).toBeA(InsufficientCredentialsError);
          });
      });

      it('should fail when a location header is not provided', function() {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(this.client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .catch((error) => {
            expect(error).toBeA(MobileIdentityConnectError);
            expect(error.message).toEqual(`Unable to authorize user with username ${username}.`,
              'A location header was not provided with a code to exchange for an auth token.');
          });
      });

      it('should succeed with valid credentials', function() {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'custom';
        const password = '1234';
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
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(this.client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: MobileIdentityConnect.identity,
              client_id: this.client.appKey,
              redirect_uri: redirectUri,
              protocol: this.client.micProtocol,
              host: this.client.micHost
            }));
          });
      });

      it('should ignore an invalid micId', function() {
        const micId = {};
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'custom';
        const password = '1234';
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
            `client_id=${encodeURIComponent(this.client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${encodeURIComponent(this.client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(this.client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${encodeURIComponent(this.client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          micId: micId,
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: MobileIdentityConnect.identity,
              client_id: this.client.appKey,
              redirect_uri: redirectUri,
              protocol: this.client.micProtocol,
              host: this.client.micHost
            }));
          });
      });

      it('should accept a valid micId', function() {
        const micId = randomString();
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'custom';
        const password = '1234';
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
            `client_id=${encodeURIComponent(this.client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${encodeURIComponent(this.client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(this.client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${encodeURIComponent(this.client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          micId: micId,
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: MobileIdentityConnect.identity,
              client_id: `${this.client.appKey}.${micId}`,
              redirect_uri: redirectUri,
              protocol: this.client.micProtocol,
              host: this.client.micHost
            }));
          });
      });
    });
  });
});

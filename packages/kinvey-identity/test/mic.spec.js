const { MobileIdentityConnect, AuthorizationGrant } = require('../src');
const { InsufficientCredentialsError, MobileIdentityConnectError } = require('kinvey-errors');
const { Client } = require('kinvey-client');
const { randomString } = require('kinvey-utils/string');
const { NetworkRack } = require('kinvey-request');
const { User } = require('kinvey-user');
const { init } = require('kinvey');
const { HttpMiddleware } = require('./http');
const assign = require('lodash/assign');
const expect = require('expect');
const nock = require('nock');
const url = require('url');
const redirectUri = 'http://localhost:3000';

describe('MobileIdentityConnect', () => {
  let client;

  before(() => {
    NetworkRack.useHttpMiddleware(new HttpMiddleware());
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  before(() => {
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

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return User.login(username, password);
  });

  describe('identity', () => {
    it('should return MobileIdentityConnect', () => {
      expect(MobileIdentityConnect.identity).toEqual('kinveyAuth');
      expect(new MobileIdentityConnect().identity).toEqual('kinveyAuth');
    });
  });

  describe('isSupported()', () => {
    it('should return true', () => {
      expect(MobileIdentityConnect.isSupported()).toEqual(true);
      expect(new MobileIdentityConnect().isSupported()).toEqual(true);
    });
  });

  describe('login()', () => {
    describe('AuthorizationGrant.AuthorizationCodeAPI', () => {
      it('should fail with invalid credentials', () => {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
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

      it('should fail when a location header is not provided', () => {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
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

      it('should succeed with valid credentials', () => {
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
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
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
              client_id: client.appKey,
              redirect_uri: redirectUri,
              protocol: client.micProtocol,
              host: client.micHost
            }));
          });
      });

      it('should ignore an invalid micId', () => {
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
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${encodeURIComponent(client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${encodeURIComponent(client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${encodeURIComponent(client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
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
              client_id: client.appKey,
              redirect_uri: redirectUri,
              protocol: client.micProtocol,
              host: client.micHost
            }));
          });
      });

      it('should accept a valid micId', () => {
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
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/auth',
            `client_id=${encodeURIComponent(client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
            tempLoginUriParts.pathname,
            `client_id=${encodeURIComponent(client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8',
            Location: `${redirectUri}/?code=${code}`
          });

        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/oauth/token',
            `grant_type=authorization_code&client_id=${encodeURIComponent(client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
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
              client_id: `${client.appKey}.${micId}`,
              redirect_uri: redirectUri,
              protocol: client.micProtocol,
              host: client.micHost
            }));
          });
      });
    });
  });
});

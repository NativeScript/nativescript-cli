import assign from 'lodash/assign';
import expect from 'expect';
import nock from 'nock';
import url from 'url';
import * as mic from './mic';
import { InsufficientCredentialsError, MobileIdentityConnectError, KinveyError } from '../../errors';
import { randomString } from 'kinvey-test-utils';
import { register } from 'kinvey-http-node';
import { login } from 'kinvey-identity';
import { init } from 'kinvey-app';

const redirectUri = 'http://localhost:3000';

describe('MobileIdentityConnect', () => {
  let client;

  before(() => {
    register();
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
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

    return login(username, password);
  });

  describe('identity', () => {
    it('should return MobileIdentityConnect', () => {//TODO: obsolete?
      expect(MobileIdentityConnect.identity).toEqual('kinveyAuth');
      expect(new MobileIdentityConnect().identity).toEqual('kinveyAuth');
    });
  });

  describe('isSupported()', () => {
    it('should return true', () => {//TODO:obsolete?
      expect(MobileIdentityConnect.isSupported()).toEqual(true);
      expect(new MobileIdentityConnect().isSupported()).toEqual(true);
    });
  });

  describe('login()', () => {
    describe('AuthorizationGrant.AuthorizationCodeAPI', () => {
      it('should fail if a redirect uri is not provided', () => {// TODO:: Errors should be reverted
        const username = 'test';
        const password = 'test';
        //const mic = new MobileIdentityConnect();
        return mic.login(null, mic.AuthorizationGrant.AuthorizationCodeAPI, { username, password })
          .then(() => {
            throw new Error('This test should fail');
          })
          .catch((error) => {
            expect(error).toBeA(KinveyError);
            expect(error.message).toEqual('A redirectUri is required and must be a string.');
          });
      });

      it('should fail if redirect uri is not a string', () => {// TODO:: Errors should be reverted
          const username = 'test';
          const password = 'test';
          //const mic = new MobileIdentityConnect();
          return mic.login({}, mic.AuthorizationGrant.AuthorizationCodeAPI, { username, password })
            .then(() => {
              throw new Error('This test should fail');
            })
            .catch((error) => {
              expect(error).toBeA(KinveyError);
              expect(error.message).toEqual('A redirectUri is required and must be a string.');
            });
      });

      it('should fail with invalid credentials', () => {// TODO:: In login, there is a getTempUrl function that seem to return an Object which is then passed as url?
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/v3/oauth/auth',
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
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
          )
          .reply(401, {
            error: 'access_denied',
            error_description: 'The resource owner or authorization server denied the request.',
            debug: 'Authentication failed for undefined'
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        //const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, mic.AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .catch((error) => {
            expect(error).toBeA(InsufficientCredentialsError);
          });
      });

      it('should fail when a location header is not provided', () => {// TODO:: In login, there is a getTempUrl function that seem to return an Object which is then passed as url?
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');
        const username = 'test';
        const password = 'test';

        // API Response
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/v3/oauth/auth',
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
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
          )
          .reply(302, null, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        //const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, mic.AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .catch((error) => {
            expect(error).toBeA(MobileIdentityConnectError);
            expect(error.message).toEqual(`Unable to authorize user with username ${username}.`,
              'A location header was not provided with a code to exchange for an auth token.');
          });
      });

      it('should hit the correct endpoint version', () => {
        const tempLoginUriParts = url.parse('https://auth.kinvey.com/oauth/authenticate/f2cb888e651f400e8c05f8da6160bf12');

        nock(client.micHostname, { encodedQueryParams: true })
          .post(
            '/v1/oauth/auth',
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          }, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        //const mic = new MobileIdentityConnect();
        return mic.getTempLoginUrl(client.appKey, redirectUri, 1)
          .then((response)=> {
            expect(response.temp_login_uri).toBe(tempLoginUriParts.href);
          });
      });

      it('should succeed with valid credentials', () => {//TODO: login now returns the token and used to return the properties from the expected object
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
            '/v3/oauth/auth',
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
            `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
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
          .basicAuth({
            user: client.appKey,
            pass: client.appSecret
          })
          .reply(200, token, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        //const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, mic.AuthorizationGrant.AuthorizationCodeAPI, {
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: mic.IDENTITY,
              client_id: client.appKey,
              redirect_uri: redirectUri,
              protocol: client.micProtocol,
              host: client.micHost
            }));
          });
      });

      it('should ignore an invalid micId', () => {//TODO: login now returns the token and used to return the properties from the expected object
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
            '/v3/oauth/auth',
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
            `client_id=${encodeURIComponent(client.appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
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

        //const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, mic.AuthorizationGrant.AuthorizationCodeAPI, {
          micId: micId,
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: mic.IDENTITY,
              client_id: client.appKey,
              redirect_uri: redirectUri,
              protocol: client.micProtocol,
              host: client.micHost
            }));
          });
      });

      it('should accept a valid micId', () => {//TODO: login now returns the token and used to return the properties from the expected object
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
            '/v3/oauth/auth',
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
            `client_id=${encodeURIComponent(client.appKey+'.'+micId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${username}&password=${password}&scope=openid`
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
          .basicAuth({
            user: client.appKey + '.' + micId,
            pass: client.appSecret
          })
          .reply(200, token, {
            'Content-Type': 'application/json; charset=utf-8'
          });

        //const mic = new MobileIdentityConnect();
        return mic.login(redirectUri, mic.AuthorizationGrant.AuthorizationCodeAPI, {
          micId: micId,
          username: username,
          password: password
        })
          .then((response) => {
            expect(response).toEqual(assign(token, {
              identity: mic.IDENTITY,
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

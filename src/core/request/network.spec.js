import url from 'url';
import nock from 'nock';
import expect from 'expect';
import { KinveyRequest } from './network';
import { Request } from './request';
import { InvalidCredentialsError, ServerError, TimeoutError } from '../errors';
import { randomString } from '../utils';
import { AuthorizationGrant } from '../identity';
import { init } from '../kinvey';
import { User } from '../user';

describe('KinveyRequest', () => {
  let client;

  function loginWithMIC(redirectUri, authorizationGrant, options) {
    nock(client.apiHostname, { encodedQueryParams: true })
      .post(`${client.pathname}/_logout`)
      .reply(204);

    return User.logout()
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
        nock(client.micHostname, { encodedQueryParams: true })
          .post(
          '/v3/oauth/auth',
          `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`
          )
          .reply(200, {
            temp_login_uri: tempLoginUriParts.href
          });

        nock(`${tempLoginUriParts.protocol}//${tempLoginUriParts.host}`, { encodedQueryParams: true })
          .post(
          tempLoginUriParts.pathname,
          `client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&username=${options.username}&password=${options.password}`
          )
          .reply(302, null, {
            Location: `${redirectUri}/?code=${code}`
          });

        nock(client.micHostname, { encodedQueryParams: true })
          .post(
          '/oauth/token',
          `grant_type=authorization_code&client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
          )
          .reply(200, token);

        nock(client.apiHostname, { encodedQueryParams: true })
          .post(`/user/${client.appKey}/login`, () => true)
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

        return User.loginWithMIC(redirectUri, authorizationGrant, options);
      });
  }

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new KinveyRequest();
      expect(request).toBeA(KinveyRequest);
      expect(request).toBeA(Request);
    });
  });

  describe('execute()', () => {
    it('should return the response', () => {
      const reply = { foo: randomString() };

      // Setup API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(200, reply);

      const request = new KinveyRequest({
        url: `${client.apiHostname}/foo`
      });
      return request.execute()
        .then((response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.data).toEqual(reply);
        });
    });

    it('should redirect', () => {
      // Setup API response
      nock(client.apiHostname)
        .get('/foo')
        .reply(307, {}, {
          Location: 'http://test.com'
        });

      nock('http://test.com')
        .get('/')
        .reply(200, {
          one: 'two',
          key: 'value'
        });

      const request = new KinveyRequest({
        url: `${client.apiHostname}/foo`
      });
      return request.execute()
        .then((response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.data).toEqual({
            one: 'two',
            key: 'value'
          });
        });
    });

    it('should not redirect', () => {
      // Setup API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(307, {}, {
          Location: 'http://test.com'
        });

      const request = new KinveyRequest({
        url: `${client.apiHostname}/foo`,
        followRedirect: false
      });
      return request.execute()
        .then((response) => {
          expect(response.statusCode).toEqual(307);
          expect(response.data).toEqual({});
          expect(response.headers.get('Location')).toEqual('http://test.com');
        });
    });

    it('should throw a ServerError', () => {
      const kinveyRequestId = randomString();

      // Setup API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(500, {
          message: 'An error has occurred on the server.',
          debug: 'Please retry the request again.'
        }, {
          'X-Kinvey-Request-ID': kinveyRequestId
        });

      const request = new KinveyRequest({
        url: `${client.apiHostname}/foo`
      });
      return request.execute()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.name).toEqual('ServerError');
          expect(error.message).toEqual('An error has occurred on the server.');
          expect(error.debug).toEqual('Please retry the request again.');
          expect(error.code).toEqual(500);
          expect(error.kinveyRequestId).toEqual(kinveyRequestId);
        });
    });

    it('should throw a TimeoutError', () => {
      // Setup API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .socketDelay(2000)
        .reply(200);

      const request = new KinveyRequest({
        url: `${client.apiHostname}/foo`
      });
      return request.execute()
        .catch((error) => {
          expect(error).toBeA(TimeoutError);
          expect(error.name).toEqual('TimeoutError');
          expect(error.message).toEqual('The request timed out.');
        });
    });

    describe('InvalidCredentialsError', () => {
      it('should throw the error if no session exists', () => {
        // Setup API response
        nock(client.apiHostname, { encodedQueryParams: true })
          .get('/foo')
          .reply(401, {
            name: 'InvalidCredentials',
            message: 'Invalid credentials. Please retry your request with correct credentials.'
          });

        const request = new KinveyRequest({
          url: `${client.apiHostname}/foo`
        });
        return request.execute()
          .catch((error) => {
            expect(error).toBeA(InvalidCredentialsError);
            expect(error.name).toEqual('InvalidCredentialsError');
            expect(error.message).toEqual('Invalid credentials. Please retry your request with correct credentials.');
            expect(error.debug).toEqual(undefined);
            expect(error.code).toEqual(401);
          });
      });

      it('should throw the error if unable to refresh the session', () => {
        const redirectUri = 'http://localhost:3000';
        return loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: randomString(),
          password: randomString()
        })
          .then((user) => {
            const refreshToken = user.data._socialIdentity.kinveyAuth.refresh_token;

            // Setup API response
            nock(client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(401, {
                name: 'InvalidCredentials',
                message: 'Invalid credentials. Please retry your request with correct credentials.'
              });

            nock(client.micHostname, { encodedQueryParams: true })
              .post(
                '/oauth/token',
                `grant_type=refresh_token&client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&refresh_token=${refreshToken}`
              )
              .reply(500, {
                message: 'An error occurred while refreshing the session. Please retry the request.'
              });

            const request = new KinveyRequest({
              url: `${client.apiHostname}/foo`
            });
            return request.execute()
              .catch((error) => {
                expect(error).toBeA(InvalidCredentialsError);
                expect(error.name).toEqual('InvalidCredentialsError');
                expect(error.message).toEqual('Invalid credentials. Please retry your request with correct credentials.');
                expect(error.debug).toEqual(undefined);
                expect(error.code).toEqual(401);
              });
          });
      });

      it('should refresh the session and send the original request', () => {
        const redirectUri = 'http://localhost:3000';
        return loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: randomString(),
          password: randomString()
        })
          .then((user) => {
            const refreshToken = user.data._socialIdentity.kinveyAuth.refresh_token;
            const newSession = {
              access_token: randomString(),
              token_type: 'bearer',
              expires_in: 3599,
              refresh_token: randomString()
            };
            const reply = { foo: 'bar' };

            // Setup API response
            nock(client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(401, {
                name: 'InvalidCredentials',
                message: 'Invalid credentials. Please retry your request with correct credentials.'
              });

            nock(client.micHostname, { encodedQueryParams: true })
              .post(
                '/oauth/token',
                `grant_type=refresh_token&client_id=${client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&refresh_token=${refreshToken}`
              )
              .reply(200, newSession);

            nock(client.apiHostname, { encodedQueryParams: true })
              .post(`/user/${client.appKey}/login`, () => true)
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
                  kinveyAuth: newSession
                }
              });

            nock(client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(200, reply);

            const request = new KinveyRequest({
              url: `${client.apiHostname}/foo`
            });
            return request.execute()
              .then((response) => {
                expect(response.data).toEqual(reply);
              });
          });
      });
    });
  });
});

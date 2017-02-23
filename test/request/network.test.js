import Request, { KinveyRequest } from 'src/request';
import { InvalidCredentialsError, ServerError, TimeoutError } from 'src/errors';
import { randomString } from 'src/utils';
import { AuthorizationGrant } from 'src/identity';
import { UserMock } from 'test/mocks';
import url from 'url';
import nock from 'nock';
import expect from 'expect';

describe('KinveyRequest', () => {
  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new KinveyRequest();
      expect(request).toBeA(KinveyRequest);
      expect(request).toBeA(Request);
    });
  });

  describe('execute()', () => {
    it('should return the response', function() {
      const reply = { foo: randomString() };

      // Setup API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(200, reply);

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: '/foo'
        })
      });
      return request.execute()
        .then((response) => {
          expect(response.statusCode).toEqual(200);
          expect(response.data).toEqual(reply);
        });
    });

    it('should redirect', function() {
      // Setup API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(307, {}, {
          Location: 'http://echo.jsontest.com/key/value/one/two'
        });

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: '/foo'
        })
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

    it('should not redirect', function() {
      // Setup API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(307, {}, {
          Location: 'http://echo.jsontest.com/key/value/one/two'
        });

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: '/foo'
        }),
        followRedirect: false
      });
      return request.execute()
        .then((response) => {
          expect(response.statusCode).toEqual(307);
          expect(response.data).toEqual({});
          expect(response.headers.get('Location')).toEqual('http://echo.jsontest.com/key/value/one/two');
        });
    });

    it('should throw a ServerError', function() {
      const kinveyRequestId = randomString();

      // Setup API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .reply(500, {
          message: 'An error has occurred on the server.',
          debug: 'Please retry the request again.'
        }, {
          'X-Kinvey-Request-ID': kinveyRequestId
        });

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: '/foo'
        })
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

    it('should throw a TimeoutError', function() {
      // Setup API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get('/foo')
        .socketDelay(2000)
        .reply(200);

      const request = new KinveyRequest({
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: '/foo'
        })
      });
      return request.execute()
        .catch((error) => {
          expect(error).toBeA(TimeoutError);
          expect(error.name).toEqual('TimeoutError');
          expect(error.message).toEqual('The request timed out.');
        });
    });

    describe('InvalidCredentialsError', function() {
      it('should throw the error if no session exists', function() {
        // Setup API response
        nock(this.client.apiHostname, { encodedQueryParams: true })
          .get('/foo')
          .reply(401, {
            name: 'InvalidCredentials',
            message: 'Invalid credentials. Please retry your request with correct credentials.'
          });

        const request = new KinveyRequest({
          url: url.format({
            protocol: this.client.apiProtocol,
            host: this.client.apiHost,
            pathname: '/foo'
          })
        });
        return request.execute()
          .catch((error) => {
            expect(error).toBeA(InvalidCredentialsError);
            expect(error.name).toEqual('InvalidCredentialsError');
            expect(error.message).toEqual('Invalid credentials. Please retry your request with correct credentials.');
            expect(error.debug).toEqual('');
            expect(error.code).toEqual(401);
          });
      });

      it('should throw the error if unable to refresh the session', function() {
        const redirectUri = 'http://localhost:3000';
        return UserMock.loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
          username: randomString(),
          password: randomString()
        })
          .then((user) => {
            const refreshToken = user.data._socialIdentity.kinveyAuth.refresh_token;

            // Setup API response
            nock(this.client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(401, {
                name: 'InvalidCredentials',
                message: 'Invalid credentials. Please retry your request with correct credentials.'
              });

            nock(this.client.micHostname, { encodedQueryParams: true })
              .post(
                '/oauth/token',
                `grant_type=refresh_token&client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&refresh_token=${refreshToken}`
              )
              .reply(500, {
                message: 'An error occurred while refreshing the session. Please retry the request.'
              });

            const request = new KinveyRequest({
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: '/foo'
              })
            });
            return request.execute()
              .catch((error) => {
                expect(error).toBeA(InvalidCredentialsError);
                expect(error.name).toEqual('InvalidCredentialsError');
                expect(error.message).toEqual('Invalid credentials. Please retry your request with correct credentials.');
                expect(error.debug).toEqual('');
                expect(error.code).toEqual(401);
              });
          });
      });

      it('should refresh the session and send the original request', function() {
        const redirectUri = 'http://localhost:3000';
        return UserMock.loginWithMIC(redirectUri, AuthorizationGrant.AuthorizationCodeAPI, {
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
            nock(this.client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(401, {
                name: 'InvalidCredentials',
                message: 'Invalid credentials. Please retry your request with correct credentials.'
              });

            nock(this.client.micHostname, { encodedQueryParams: true })
              .post(
                '/oauth/token',
                `grant_type=refresh_token&client_id=${this.client.appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&refresh_token=${refreshToken}`
              )
              .reply(200, newSession);

            nock(this.client.apiHostname, { encodedQueryParams: true })
              .post(`/user/${this.client.appKey}/login`, { _socialIdentity: { kinveyAuth: newSession } })
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

            nock(this.client.apiHostname, { encodedQueryParams: true })
              .get('/foo')
              .reply(200, reply);

            const request = new KinveyRequest({
              url: url.format({
                protocol: this.client.apiProtocol,
                host: this.client.apiHost,
                pathname: '/foo'
              })
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

import Request, { KinveyRequest } from 'src/request';
import { ServerError, TimeoutError } from 'src/errors';
import { randomString } from 'src/utils';
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
  });
});

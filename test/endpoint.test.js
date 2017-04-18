import CustomEndpoint from 'src/endpoint';
import Client from 'src/client';
import { KinveyError, NotFoundError } from 'src/errors';
import nock from 'nock';
import expect from 'expect';

describe('Endpoint', function() {
  // Get the shared client instance
  before(function() {
    this.client = Client.sharedInstance();
  });

  // Cleanup
  after(function() {
    delete this.client;
  });

  describe('constructor', function() {
    it('should not be able to create an instance of the CustomEndpoint class', function() {
      expect(() => {
        const endpoint = new CustomEndpoint();
        return endpoint;
      }).toThrow();
    });
  });

  describe('execute()', function() {
    it('should throw a KinveyError when an endpoint argument is not provided', function() {
      return CustomEndpoint.execute()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw a KinveyError when the endpoint argument is not a string', function() {
      return CustomEndpoint.execute({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should throw NotFoundError for a custom endpoint that does not exist', function() {
      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${this.client.appKey}/custom/doesnotexist`)
        .reply(404, {
          error: 'EndpointDoesNotExist',
          description: 'The custom endpoint you tried to access does not exist.'
            + ' Please configure custom Business Logic endpoints through the Kinvey Console.',
          debug: ''
        });

      // Execute custom endpoint
      return CustomEndpoint.execute('doesnotexist')
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should execute a custom endpoint and return the response', function() {
      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${this.client.appKey}/custom/test`)
        .reply(200, {
          message: 'Hello, World!'
        }, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '27',
          'x-kinvey-request-id': '85ada36c8c0a40a18b2016e1554147d5',
          'x-kinvey-api-version': '4'
        });

      // Execute custom endpoint
      return CustomEndpoint.execute('test')
        .then((response) => {
          expect(response).toEqual({ message: 'Hello, World!' });
        });
    });

    it('should execute a custom endpoint with args and return the response', function() {
      const args = { message: 'Hello, Tests!' };

      // Setup nock response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/rpc/${this.client.appKey}/custom/test`)
        .reply(200, args, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '27',
          'x-kinvey-request-id': 'e71d9d14412e4f1eab803a915b4b71cd',
          'x-kinvey-api-version': '4'
        });

      // Execute custom endpoint
      return CustomEndpoint.execute('test', args)
        .then((response) => {
          expect(response).toEqual(args);
        });
    });
  });
});

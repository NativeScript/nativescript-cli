import { SerializeMiddleware } from '../../../src/rack';
import expect from 'expect';

describe('SerializeMiddleware', function() {
  describe('constructor', function() {
    it('should set the name to \'Kinvey Serialize Middleware\'', function() {
      expect(new SerializeMiddleware().name).toEqual('Kinvey Serialize Middleware');
    });

    it('should set the name to \'Test Serialize Middleware\'', function() {
      expect(new SerializeMiddleware('Test Serialize Middleware').name).toEqual('Test Serialize Middleware');
    });
  });

  describe('handle()', function() {
    it('should handle no request', async function() {
      const middleware = new SerializeMiddleware();
      const result = await middleware.handle(null);
      expect(result.request).toEqual(null);
    });

    it('should handle a request with no body', async function() {
      const request = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const middleware = new SerializeMiddleware();
      const result = await middleware.handle(request);
      expect(result.request).toEqual(request);
    });

    it('should serialize a request with Content-Type: application/json', async function() {
      const body = { message: 'Hello, World!' };
      const request = {
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      };
      const middleware = new SerializeMiddleware();
      const result = await middleware.handle(request);
      expect(result.request.body).toEqual(JSON.stringify(body));
    });

    it('should serialize a request with Content-Type: application/x-www-form-urlencoded', async function() {
      const body = { message: 'Hello, World!' };
      const request = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      };

      const middleware = new SerializeMiddleware();
      const result = await middleware.handle(request);

      const keys = Object.keys(body);
      const str = [];
      for (const key of keys) {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
      }

      expect(result.request.body).toEqual(str.join('&'));
    });

    it('should not serialize a request with an unsopported Content-Type', async function() {
      const body = 'Hello, World!';
      const request = {
        headers: {
          'Content-Type': 'application/xml'
        },
        body: body
      };
      const middleware = new SerializeMiddleware();
      const result = await middleware.handle(request);
      expect(result.request.body).toEqual(body);
    });
  });
});

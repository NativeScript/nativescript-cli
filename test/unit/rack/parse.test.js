import { ParseMiddleware } from '../../../src/rack';
import expect from 'expect';

describe('ParseMiddleware', function() {
  describe('constructor', function() {
    it('should set the name to \'Kinvey Parse Middleware\'', function() {
      expect(new ParseMiddleware().name).toEqual('Kinvey Parse Middleware');
    });

    it('should set the name to \'Test Parse Middleware\'', function() {
      expect(new ParseMiddleware('Test Parse Middleware').name).toEqual('Test Parse Middleware');
    });
  });

  describe('handle()', function() {
    it('should handle no response', async function() {
      const middleware = new ParseMiddleware();
      const result = await middleware.handle(null, null);
      expect(result.response).toEqual(null);
    });

    it('should handle a response with no data', async function() {
      const response = {
        headers: {
          'content-type': 'application/json'
        }
      };
      const middleware = new ParseMiddleware();
      const result = await middleware.handle(null, response);
      expect(result.response).toEqual(response);
    });

    it('should parse JSON formatted response data', async function() {
      const data = { message: 'Hello, World!' };
      const response = {
        headers: {
          'content-type': 'application/json'
        },
        data: JSON.stringify(data)
      };
      const middleware = new ParseMiddleware();
      const result = await middleware.handle(null, response);
      expect(result.response.data).toEqual(data);
    });

    it('should not parse unsupported formatted response data', async function() {
      const data = '<?xml version="1.0" encoding="UTF-8"?><message>Hello, World!</message>';
      const response = {
        headers: {
          'content-type': 'application/xml'
        },
        data: data
      };
      const middleware = new ParseMiddleware();
      const result = await middleware.handle(null, response);
      expect(result.response.data).toEqual(data);
    });
  });
});

import Request from 'src/request';
import Client from 'src/client';
import expect from 'expect';

describe('Request', function() {
  describe('constructor', function() {
    it('should throw an error if timeout is not a number', function() {
      expect(() => {
        const timeout = 'foo';
        const request = new Request();
        request.timeout = timeout;
      }).toThrow(/Invalid timeout. Timeout must be a number./);
    });

    it('should set timeout with client default timeout', function() {
      const client = new Client({ defaultTimeout: 10000 });
      const request = new Request({ client: client });
      expect(request.timeout).toEqual(client.defaultTimeout);
    });

    it('should set timeout with passed value', function() {
      const timeout = 10;
      const request = new Request({
        timeout: timeout
      });
      expect(request.timeout).toEqual(timeout);
    });
  });
});

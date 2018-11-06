import expect from 'expect';
import { Request } from './request';
import { init } from 'kinvey-app';
import { randomString } from 'kinvey-test-utils';

describe('Request', () => {
  describe('constructor', () => {
    it('should throw an error if timeout is not a number', () => {//TODO: We have not getter and setter for timeout and validation for it
      expect(() => {
        const timeout = 'foo';
        const request = new Request();
        request.timeout = timeout;
      }).toThrow(/Invalid timeout. Timeout must be a number./);
    });

    it('should set timeout with client default timeout', () => {//TODO: how does the global timeout value transfer to the requests?
      const client = init({
        appKey: randomString(),
        appSecret: randomString(),
        defaultTimeout: 10000
      })
      const request = new Request({ client: client });
      expect(request.timeout).toEqual(client.defaultTimeout);
    });

    it('should set timeout with passed value', () => {
      const timeout = 10;
      const request = new Request({
        timeout: timeout
      });
      expect(request.timeout).toEqual(timeout);
    });
  });
});


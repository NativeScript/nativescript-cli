import expect from 'expect';
import { randomString } from '../../tests/utils';
import init from '../kinvey/init';
import { Request } from './request';

describe('Request', () => {
  before(() => {
    return init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  describe('constructor', () => {
    it('should throw an error if timeout is not a number', () => {
      expect(() => {
        const timeout = 'foo';
        const request = new Request();
        request.timeout = timeout;
      }).toThrow(/Invalid timeout. Timeout must be a number./);
    });

    it('should set timeout with client default timeout', () => {
      const client = init({
        appKey: randomString(),
        appSecret: randomString(),
        defaultTimeout: 10000
      })
      const request = new Request();
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

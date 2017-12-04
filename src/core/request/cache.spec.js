import expect from 'expect';
import { randomString } from '../utils';
import { CacheRequest } from './cache';
import { Request } from './request';

describe('CacheRequest', () => {
  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });
});

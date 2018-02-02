import expect from 'expect';
import { randomString } from '../utils';
import { CacheRequest } from './cache';
import { Request } from './request';
import { Client } from '../client';

describe('CacheRequest', () => {
  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });

  describe('toPlainObject()', () => {
    it('should have storageProviders', () => {
      const storageProviders = [randomString()];
      const client = new Client({ storage: storageProviders });
      const request = new CacheRequest({ client: client });
      expect(request.toPlainObject()).toInclude({ storageProviders: storageProviders });
    });
  });
});

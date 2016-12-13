import Request, { CacheRequest } from 'src/request';
import expect from 'expect';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

describe('CacheRequest', () => {
  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });
});

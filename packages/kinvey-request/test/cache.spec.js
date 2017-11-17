const expect = require('expect');
const { init } = require('kinvey');
const { randomString } = require('kinvey-utils/string');
const { CacheRequest, Request } = require('../src');

describe('CacheRequest', () => {
  let client;

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
  });

  describe('constructor', () => {
    it('should be an instance of Request', () => {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });
});

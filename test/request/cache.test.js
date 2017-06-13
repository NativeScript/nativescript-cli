import expect from 'expect';
import url from 'url';
import Request, { CacheRequest, RequestMethod } from 'src/request';
import { User } from 'src/entity';
import { randomString } from 'src/utils';

const usersNamespace = 'user';
const activeUserCollectionName = 'kinvey_active_user';

describe('CacheRequest', function() {
  describe('constructor', function() {
    it('should be an instance of Request', function() {
      const request = new CacheRequest();
      expect(request).toBeA(CacheRequest);
      expect(request).toBeA(Request);
    });
  });
});

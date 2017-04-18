import expect from 'expect';
import localStorage from 'local-storage';
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

  describe('loadActiveUser()', function() {
    beforeEach(function() {
      return User.logout();
    });

    it('should not find an active user', function() {
      return CacheRequest.loadActiveUser()
        .then((activeUser) => {
          expect(activeUser).toEqual(null);
        });
    });

    it('should load an active user', function() {
      const user = { _id: randomString(), _kmd: { authtoken: randomString() } };
      const request = new CacheRequest({
        method: RequestMethod.POST,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/${usersNamespace}/${this.client.appKey}/${activeUserCollectionName}`
        }),
        body: user
      });
      return request.execute()
        .then(() => {
          return CacheRequest.loadActiveUser(this.client);
        })
        .then((activeUser) => {
          expect(activeUser).toEqual(user);
          expect(CacheRequest.getActiveUser()).toEqual(user);
        });
    });

    it('should load an active user from legacy storage', function() {
      const user = { _id: randomString(), _kmd: { authtoken: randomString() } };
      localStorage.set(`${this.client.appKey}kinvey_user`, user);
      return CacheRequest.loadActiveUser(this.client)
        .then((activeUser) => {
          expect(activeUser).toEqual(user);
          expect(CacheRequest.getActiveUser()).toEqual(user);
        });
    });
  });
});

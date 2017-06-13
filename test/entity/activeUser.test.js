import expect from 'expect';
import { ActiveUserHelper } from 'src/entity';
import { randomString } from 'src/utils';

describe('ActiveUser', function() {
  describe('getActiveUser()', function() {
    it('should return the current active user even if setActiveUser() hasn\'t complete', function() {
      const user = { _id: randomString(), _kmd: { authtoken: randomString() } };
      const promise = ActiveUserHelper.set(this.client, user);
      expect(ActiveUserHelper.get()).toEqual(user);
      return promise;
    });

    it('should return null user even if setActiveUser() hasn\'t complete', function() {
      const promise = ActiveUserHelper.set(this.client, null);
      expect(ActiveUserHelper.get()).toEqual(null);
      return promise;
    });
  });
});
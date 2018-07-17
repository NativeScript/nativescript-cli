import { expect } from 'chai';
import { init, User } from '__SDK__';

describe('Auth', () => {
  before(() => {
    init({
      appKey: 'kid_SykZReklX',
      appSecret: 'adc893c7824e4c8caa4b33027a2ff883'
    });
  });

  describe('login()', () => {
    it('should login', async () => {
      const username = 'test';
      const password = 'test';
      await User.signup({ username, password }, { state: false });
      const user = await User.login('test', 'test');
      expect(user.username).to.equal(username);
    });
  });
});

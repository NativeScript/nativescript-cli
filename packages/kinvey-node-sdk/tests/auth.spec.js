import { expect } from 'chai';
import { init, User } from '/Users/thomasconner/Documents/Development/Kinvey/SDKs/JavaScript/packages/kinvey-node-sdk/lib/index.js';
import { randomString } from './utils';

describe('Auth', () => {
  before(() => {
    init({
      appKey: 'kid_SykZReklX',
      appSecret: 'adc893c7824e4c8caa4b33027a2ff883'
    });
  });

  describe('login()', () => {
    afterEach(() => {
      return User.logout();
    });

    it('should login', async () => {
      const username = randomString();
      const password = randomString();
      await User.signup({ username, password }, { state: false });
      const user = await User.login(username, password);
      expect(user.username).to.equal(username);
      await User.remove(user._id, { hard: true });
    });

    it('should login by providing credentials as an object', async () => {
      const username = randomString();
      const password = randomString();
      await User.signup({ username, password }, { state: false });
      const user = await User.login({ username, password });
      expect(user.username).to.equal(username);
      await User.remove(user._id, { hard: true });
    });
  });

  describe('logout()', () => {
    it('should logout', async () => {
      const username = randomString();
      const password = randomString();
      const user = await User.signup({ username, password });
      await User.logout();
      expect(User.getActiveUser()).to.be.undefined;
      await User.login({ username, password });
      await User.remove(user._id, { hard: true });
    });

    it('should logout when there is not an active user', async () => {
      expect(User.getActiveUser()).to.be.undefined;
      await User.logout();
      expect(User.getActiveUser()).to.be.undefined;
    });
  });

  describe('signup()', () => {
    afterEach(() => {
      return User.logout();
    });

    it('should signup and set the user as the active user', async () => {
      const username = randomString();
      const password = randomString();
      const user = await User.signup({ username, password });
      expect(User.getActiveUser()).to.deep.equal(user);
      await User.remove(user._id, { hard: true });
    });

    it('should signup with additional properties', async () => {
      const username = randomString();
      const password = randomString();
      const name = randomString();
      const user = await User.signup({ username, password, name });
      expect(user).to.have.property('name', name);
      await User.remove(user._id, { hard: true });
    });

    it('should signup and not set the user as the active user if options.state is false', async () => {
      const username = randomString();
      const password = randomString();
      const user = await User.signup({ username, password }, { state: false });
      expect(User.getActiveUser()).to.be.undefined;
      await User.login({ username, password });
      await User.remove(user._id, { hard: true });
    });

    it('should signup and not set the user as the active user if options.state is false', async () => {
      const user = await User.signup();
      expect(User.getActiveUser()).to.deep.equal(user);
      await User.remove(user._id, { hard: true });
    });
  });
});

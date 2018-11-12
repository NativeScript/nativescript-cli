import { expect } from 'chai';
// eslint-disable-next-line import/extensions
import { init, User, Acl, ping } from '__SDK__';
import { randomString } from './utils';

describe('Example', () => {
  before(() => {
    return init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });

  it('should create acl', () => {
    const doc = { _acl: {} };
    const acl = new Acl(doc);
    expect(acl).toEqual(doc._acl);
  });

  it('should ping', async () => {
    const response = await ping();
    expect(response).toEqual({});
  });

  it('should login', async () => {
    const username = randomString();
    const password = randomString();
    await User.signup({ username, password }, { state: false });
    const user = await User.login(username, password);
    expect(user.username).to.equal(username);
    await User.remove(user._id, { hard: true });
  });
});

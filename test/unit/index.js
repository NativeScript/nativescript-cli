import { HttpMiddleware as CoreHttpMiddleware, KinveyRackManager } from '../../src/rack';
import { HttpMiddleware } from './mocks';
import { Kinvey } from '../../src/kinvey';
import { User } from './helpers';
import nock from 'nock';

// Record for nock
// nock.recorder.rec();

// Swap Http middleware
const networkRack = KinveyRackManager.networkRack;
networkRack.swap(CoreHttpMiddleware, new HttpMiddleware());

// Init Kinvey
before(function() {
  Kinvey.init({
    appKey: 'kid_HkTD2CJc',
    appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
  });
});

// Login a user
before(() => User.login('test', 'test'));

// Logout a user
after(() => {
  // Get the active user
  const user = User.getActiveUser();

  if (user) {
    // Logout the user
    return user.logout();
  }

  return null;
});

// Clear nock
afterEach(function() {
  nock.cleanAll();
});

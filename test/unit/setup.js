import {
  TestKinvey,
  TestUser
} from './helpers';
import nock from 'nock';

// Record for nock
// nock.recorder.rec();

// Init Kinvey
before(function() {
  this.client = TestKinvey.init({
    appKey: 'kid_HkTD2CJc',
    appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
  });
});

// Clean up
after(function() {
  delete this.client;
});

// Login a user
beforeEach(() => TestUser.login('test', 'test'));

// Logout the active user
afterEach(() => TestUser.logout());

// Clean up nock
afterEach(function() {
  nock.cleanAll();
});

import { TestKinvey as Kinvey, TestUser as User } from './mocks';
import nock from 'nock';

// Record for nock
// nock.recorder.rec();

// Init Kinvey
before(function() {
  this.client = Kinvey.init({
    appKey: 'kid_HkTD2CJc',
    appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
  });
});

// Clean up
after(function() {
  delete this.client;
});

// Login a user
beforeEach(() => User.login('test', 'test'));

// Logout the active user
afterEach(() => User.logout());

// Clean up nock
afterEach(function() {
  nock.cleanAll();
});

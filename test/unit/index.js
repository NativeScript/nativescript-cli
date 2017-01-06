import { TestUser as User } from './mocks';
import Kinvey from 'src/kinvey';
import { randomString } from 'common/utils';
import nock from 'nock';

// Record for nock
// nock.recorder.rec();

// Init Kinvey
before(function() {
  // return Kinvey.initialize({
  //   appKey: 'kid_HkTD2CJc',
  //   appSecret: 'cd7f658ed0a548dd8dfadf5a1787568b'
  // }).then(() => {
  //   this.client = Kinvey.client;
  // });

  return Kinvey.initialize({
    appKey: randomString(),
    appSecret: randomString()
  }).then(() => {
    this.client = Kinvey.client;
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

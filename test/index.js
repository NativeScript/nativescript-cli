import { UserMock } from 'src/entity';
import Kinvey from 'src/kinvey';
import { randomString } from 'src/utils';
import { SerializeMiddleware, HttpMockMiddleware, ParseMiddleware } from 'src/request';
import nock from 'nock';

// Setup network rack
Kinvey.NetworkRack.reset();
Kinvey.NetworkRack.use(new SerializeMiddleware());
Kinvey.NetworkRack.use(new HttpMockMiddleware());
Kinvey.NetworkRack.use(new ParseMiddleware());

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
beforeEach(() => UserMock.login('test', 'test'));

// Logout the active user
afterEach(() => UserMock.logout());

// Clean up nock
afterEach(function() {
  nock.cleanAll();
});

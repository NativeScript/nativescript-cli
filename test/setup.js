import { Kinvey } from '../src/kinvey';
import { randomString } from '../src/utils/string';
import { NetworkRack } from '../src/rack/rack';
import { SerializeMiddleware } from '../src/rack/middleware/serialize';
import { HttpMiddleware } from './mocks/http';
import { DeviceAdapter } from './mocks/device';
import { Device } from '../src/utils/device';
import sinon from 'sinon';

before(function() {
  Device.use(new DeviceAdapter());
});

before(function() {
  const networkRack = NetworkRack.sharedInstance();
  networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());
});


beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
  delete this.sandbox;
});

beforeEach(function() {
  this.client = Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});

afterEach(function() {
  delete this.client;
});

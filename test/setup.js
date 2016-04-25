import { Kinvey } from '../src/kinvey';
import { randomString } from '../src/utils/string';
import { NetworkRack } from '../src/rack/rack';
import { SerializeMiddleware } from '../src/rack/middleware/serialize';
import { HttpMiddleware } from './mocks/http';
import sinon from 'sinon';

before(function() {
  const networkRack = NetworkRack.sharedInstance();
  networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());
});

before(function() {
  this.client = Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});

beforeEach(function() {
  this.client = Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});

after(function() {
  delete this.client;
});

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
  delete this.sandbox;
});

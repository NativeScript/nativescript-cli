import Kinvey from '../src/kinvey';
import { randomString } from '../src/utils/string';
import { NetworkRack } from '../src/rack/rack';
import { HttpMiddleware } from '../src/rack/middleware/http';
import { TestHttpMiddleware } from './mocks/http';
import sinon from 'sinon';
import nock from 'nock';

// Swap Http middleware
const networkRack = NetworkRack.sharedInstance();
networkRack.swap(HttpMiddleware, new TestHttpMiddleware());

const client = Kinvey.init({
  appKey: randomString(),
  appSecret: randomString(),
  appVersion: randomString()
});

before(function() {
  this.client = client;
});

after(function() {
  delete this.client;
});

afterEach(function() {
  nock.cleanAll();
});

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
  delete this.sandbox;
});

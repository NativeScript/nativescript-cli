import Kinvey from '../src/kinvey';
import { randomString } from '../src/utils/string';
import sinon from 'sinon';
import nock from 'nock';
const client = Kinvey.init({
  appKey: randomString(),
  appSecret: randomString()
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

import { Kinvey } from '../src/kinvey';
import { randomString } from '../src/utils/string';
import sinon from 'sinon';

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
  delete this.sandbox;
});

before(function() {
  this.client = Kinvey.init({
    appKey: randomString(),
    appSecret: randomString()
  });
});

after(function() {
  delete this.client;
});

import Kinvey from '../src/kinvey';
const Log = require('../src/core/log');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

// Disable logs
Log.disableAll();

// Globals
global.sinon = sinon;
global.chai = chai;
global.expect = chai.expect;

before(function () {
  this.client = Kinvey.init({
    appKey: 'kid_-kGcCYykhe',
    appSecret: 'e2dd9e52710c437e9b727995fcb5ba33'
  });
});

beforeEach(function () {
  this.sandbox = global.sinon.sandbox.create();
  global.stub = this.sandbox.stub.bind(this.sandbox);
  global.spy = this.sandbox.spy.bind(this.sandbox);
});

afterEach(function () {
  delete global.stub;
  delete global.spy;
  this.sandbox.restore();
});

after(function () {
  delete this.client;
});

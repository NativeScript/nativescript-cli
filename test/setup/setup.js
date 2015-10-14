import Kinvey from '../../src/kinvey';
import log from 'loglevel';
import uid from 'uid';
import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

// Disable logs
log.disableAll();

// Globals
global.sinon = sinon;
global.chai = chai;
global.expect = chai.expect;

global.randomString = function(size) {
  return uid(size);
};

module.exports = function() {
  before(function() {
    this.client = Kinvey.init({
      appKey: global.randomString(),
      appSecret: global.randomString()
    });
  });

  beforeEach(function() {
    this.sandbox = global.sinon.sandbox.create();
    global.stub = this.sandbox.stub.bind(this.sandbox);
    global.spy = this.sandbox.spy.bind(this.sandbox);
  });

  afterEach(function() {
    delete global.stub;
    delete global.spy;
    this.sandbox.restore();
  });
};

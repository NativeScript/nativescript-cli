import { Kinvey } from '../src/kinvey';
import { UserHelper } from './helpers';
import Log from '../src/log';
import sinon from 'sinon';
import chai from 'chai';
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
    appKey: 'testAppKey',
    appSecret: 'testAppSecret'
  });
});

after(function() {
  delete this.client;
});

before(function() {
  return UserHelper.login();
});

after(function() {
  return UserHelper.logout();
});

// beforeEach(function () {
//   this.sandbox = global.sinon.sandbox.create();
//   global.stub = this.sandbox.stub.bind(this.sandbox);
//   global.spy = this.sandbox.spy.bind(this.sandbox);
// });

// afterEach(function () {
//   delete global.stub;
//   delete global.spy;
//   this.sandbox.restore();
// });

// Setup Environment
process.env.API_PROTOCOL = 'https';
process.env.API_HOSTNAME = 'baas.kinvey.com';
process.env.API_VERSION = 3;
process.env.DATABASE_LIB = 'fake-indexeddb';
process.env.HTTP_LIB = 'kinvey-http-node';
process.env.PLATFORM_ENV = 'node';

// Modules
import Kinvey from '../src/kinvey';
import log from 'loglevel';
import uid from 'uid';
import nock from 'nock';
import should from 'should';
import sinon from 'sinon';
require('should-promised');
require('should-sinon');
// import chai from 'chai';
// import sinonChai from 'sinon-chai';
//chai.use(sinonChai);

// Globals
// global.expect = chai.expect;
global.nock = nock;
global.sinon = sinon;
// global.chai = chai;
global.should = should.noConflict();
should.extend();

// Disable logs
log.disableAll();

// Hooks
before(function() {
  // API URL
  this.apiUrl = `${process.env.API_PROTOCOL}://${process.env.API_HOSTNAME}`;

  // Helper method to return a random string
  this.randomString = function(size) {
    return uid(size);
  };
});

before(function() {
  this.kinvey = Kinvey.init({
    appKey: this.randomString(),
    appSecret: this.randomString()
  });
});

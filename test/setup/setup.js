const Kinvey = require('../../src/kinvey');
const User = require('../../src/core/models/user');
const uid = require('uid');
const nock = require('nock');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

// Disable logs
Kinvey.Logger.disableAll();

// Globals
global.sinon = sinon;
global.chai = chai;
global.expect = chai.expect;

global.randomString = function(size) {
  return uid(size);
};

global.loginUser = function() {
  nock('https://baas.kinvey.com')
    .post('/user/kid_byGoHmnX2/login', {
      username: 'admin',
      password: 'admin'
    })
    .reply(200, {
      _id: '56182658b510e473120252da',
      username: 'admin',
      _kmd: {
        lmt: '2015-10-09T20:40:56.844Z',
        ect: '2015-10-09T20:40:56.844Z',
        authtoken: '0a762a45-6532-47b0-a4aa-1c0c0426debf.GaA7+APRSLIljHpldIzL+tD+GIhgQc0if2JB/T1mbBc='
      },
      _acl: {
        creator: '56182658b510e473120252da'
      }
    }, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': '270'
    });

  return User.login('admin', 'admin');
};

module.exports = function() {
  before(function() {
    this.client = Kinvey.init({
      appId: 'kid_byGoHmnX2', // global.randomString(),
      appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'// global.randomString()
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

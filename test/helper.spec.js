(function(global) {
  'use strict';

  // Assertion libs.
  var chai = require('chai');
  chai.use(require('chai-as-promised'));// Apply chai-as-promised extension.
  chai.use(require('sinon-chai'));//Apply sinon-chai extension.
  var expect = global.expect = chai.expect;

  // External libraries.
  global.sinon = require('sinon');

  // Spec files.
  require('./../dist/intermediate/config.js');

  // Kinvey library
  var Kinvey = global.Kinvey = require('./../dist/publish/kinvey-nodejs-1.3.0');

  // HTTP mocking library
  var nock = global.nock = require('nock');

  // --------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------

  // Return a random string.
  global.randomId = function() {
    return Math.random().toString(36).substring(2);
  };

  var login = global.login = function(username, password) {
    var api = nock(Kinvey.APIHostName)
      .filteringPath(/(&)?_=([^&]*)/, '')
      .filteringRequestBody(function() {
        return '*';
      })
      .post('/user/' + Kinvey.appKey + '/login/?', '*')
      .reply(200, {
        _id: '5526bacf3f82f0a517c4f024',
        username: 'test',
        _kmd: {
          lmt: '2015-04-09T17:45:51.780Z',
          ect: '2015-04-09T17:45:51.780Z',
          authtoken: '66e82c49-e71f-4074-97c8-17f77d8e2ce4.2O5DPC/r8XzyYEQs7KOP9d0faQnHPkVN1e3KKVNhqxE='
        },
        _acl: {
          creator: '5526bacf3f82f0a517c4f024'
        }
      }, {
        'content-type': 'application/json; charset=utf-8'
      });

    return Kinvey.User.login(username, password).then(function(user) {
      expect(user._id).to.exist;
      expect(api.isDone()).to.be.true;
    });
  };

  var logout = global.logout = function() {
    var api = nock(Kinvey.APIHostName)
      .filteringPath(/(&)?_=([^&]*)/, '')
      .post('/user/' + Kinvey.appKey + '/_logout/?')
      .reply(204, {}, {
        'content-type': 'application/json; charset=utf-8'
      });

    return Kinvey.User.logout().then(function() {
      expect(api.isDone()).to.be.true;
      Kinvey.setActiveUser(null);
    }).catch(function() {
      return null;
    });
  };

  // --------------------------------------------------------
  // Test Hooks
  // --------------------------------------------------------

  // Initialize the library prior to testing. After each test, reset credentials
  // in case the test altered them.
  before(function() {
    var promise = Kinvey.init({
      appKey: config.test.appKey,
      appSecret: config.test.appSecret
    });
    return promise.catch(function(error) {
      // Do not fail if the active user was deleted via the console.
      if (Kinvey.Error.INVALID_CREDENTIALS === error.name) {
        Kinvey.setActiveUser(null);
        return null;
      }
      return Kinvey.Defer.reject(error);
    });
  });
  afterEach(function() {
    Kinvey.appKey = config.test.appKey;
    Kinvey.appSecret = config.test.appSecret;
  });

  // Create a test user.
  before(function() {
    return login('test', 'test');
  });
  after(function() {
    return logout();
  });

  // Clean nock
  afterEach(function() {
    nock.cleanAll();
  });
})(global);

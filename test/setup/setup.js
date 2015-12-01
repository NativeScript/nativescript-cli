const Kinvey = require('../../src/kinvey');
const Logger = require('../../src/core/logger');
const User = require('../../src/core/models/user');
const uid = require('uid');
const result = require('lodash/object/result');
const nock = require('nock');
const isString = require('lodash/lang/isString');
const isEmpty = require('lodash/lang/isEmpty');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
let client = undefined;

// Disable logs
Logger.disableAll();

// Globals
global.sinon = sinon;
global.chai = chai;
global.expect = chai.expect;

global.randomString = function(size) {
  return uid(size);
};

global.createNockQuery = function(query, flags = {}) {
  if (query) {
    query = result(query, 'toJSON', query);
    flags.query = query.filter;

    if (!isEmpty(query.fields)) {
      flags.fields = query.fields.join(',');
    }

    if (query.limit) {
      flags.limit = query.limit;
    }

    if (query.skip > 0) {
      flags.skip = query.skip;
    }

    if (!isEmpty(query.sort)) {
      flags.sort = query.sort;
    }
  }

  for (const key in flags) {
    if (flags.hasOwnProperty(key)) {
      flags[key] = isString(flags[key]) ? flags[key] : JSON.stringify(flags[key]);
    }
  }

  return flags;
};

global.loginUser = function() {
  const reply = {
    _id: randomString(24),
    username: 'admin',
    _kmd: {
      lmt: new Date().toISOString(),
      ect: new Date().toISOString(),
      authtoken: randomString(81)
    },
    _acl: {
      creator: '56182658b510e473120252da'
    }
  };

  nock('https://baas.kinvey.com')
    .post(`/user/${client.appId}/login`, {
      username: 'admin',
      password: 'admin'
    })
    .reply(200, reply, {
      'content-type': 'application/json',
    });

  return User.login('admin', 'admin');
};

global.Common = {
  // Tests whether both deferreds and callbacks are supported on success.
  success: function(promiseFn) {
    return function() {
      var spy = sinon.spy();
      var promise = promiseFn.call(this, { success: spy }).then(function(value) {
        // If the spy was called with only one argument, it should equal the
        // fulfillment value. Otherwise, try to match the array of arguments.
        var args = spy.lastCall.args;
        args = args.length === 1 ? args[0] : args;
        expect(spy).to.be.calledOnce;
        expect(args).to.deep.equal(value);
      });
      return expect(promise).to.be.fulfilled;
    };
  },

  // Tests whether both deferreds and callbacks are supported on failure.
  failure: function(promiseFn) {
    return function() {
      var spy = sinon.spy();
      var promise = promiseFn.call(this, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(reason) {
        // If the spy was called with only one argument, it should equal the
        // rejection reason. Otherwise, try to match the array of arguments.
        var args = spy.lastCall.args;
        args = args.length === 1 ? args[0] : args;
        expect(spy).to.be.calledOnce;
        expect(args).to.deep.equal(reason);
      });
    };
  }
};

module.exports = function() {
  before(function() {
    client = this.client = Kinvey.init({
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

  after(function() {
    nock.cleanAll();
  });
};

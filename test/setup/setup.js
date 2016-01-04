const Kinvey = require('../../src/kinvey');
const Log = require('../../src/core/log');
const User = require('../../src/core/models/user');
const uid = require('uid');
const result = require('lodash/object/result');
const isString = require('lodash/lang/isString');
const isEmpty = require('lodash/lang/isEmpty');
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

global.Common = {
  randomString: function(size, prefix = '') {
    return `${prefix}${uid(size)}`;
  },

  loginUser: function() {
    return User.login('admin', 'admin');
  },

  logoutUser: function() {
    return User.getActive().then(user => {
      if (user) {
        return user.logout();
      }
    });
  },

  createNockQuery: function(query, flags = {}) {
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
  },

  // Tests whether both deferreds and callbacks are supported on success.
  success: function(promiseFn) {
    return function() {
      const spy = sinon.spy();
      const promise = promiseFn.call(this, { success: spy }).then(function(value) {
        // If the spy was called with only one argument, it should equal the
        // fulfillment value. Otherwise, try to match the array of arguments.
        let args = spy.lastCall.args;
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
      const spy = sinon.spy();
      const promise = promiseFn.call(this, { error: spy });
      return promise.then(function() {
        // We should not reach this code branch.
        return expect(promise).to.be.rejected;
      }, function(reason) {
        // If the spy was called with only one argument, it should equal the
        // rejection reason. Otherwise, try to match the array of arguments.
        let args = spy.lastCall.args;
        args = args.length === 1 ? args[0] : args;
        expect(spy).to.be.calledOnce;
        expect(args).to.deep.equal(reason);
      });
    };
  }
};

before(function() {
  this.client = Kinvey.init({
    appId: 'kid_-kGcCYykhe',
    appSecret: 'e2dd9e52710c437e9b727995fcb5ba33'
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
  delete this.client;
});

const User = require('../src/core/models/user');
const uid = require('uid');
const result = require('lodash/object/result');
const isString = require('lodash/lang/isString');
const isEmpty = require('lodash/lang/isEmpty');

export function randomString(size, prefix = '') {
  return `${prefix}${uid(size)}`;
}

export function loginUser() {
  return User.login('admin', 'admin');
}

export function logoutUser() {
  return User.getActive().then(user => {
    if (user) {
      return user.logout();
    }
  });
}

export function createNockQuery(query, flags = {}) {
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
}

// Tests whether both deferreds and callbacks are supported on success.
export function success(promiseFn) {
  return function () {
    const spy = sinon.spy();
    const promise = promiseFn.call(this, { success: spy }).then(function (value) {
      // If the spy was called with only one argument, it should equal the
      // fulfillment value. Otherwise, try to match the array of arguments.
      let args = spy.lastCall.args;
      args = args.length === 1 ? args[0] : args;
      expect(spy).to.be.calledOnce;
      expect(args).to.deep.equal(value);
    });
    return expect(promise).to.be.fulfilled;
  };
}

// Tests whether both deferreds and callbacks are supported on failure.
export function failure(promiseFn) {
  return function () {
    const spy = sinon.spy();
    const promise = promiseFn.call(this, { error: spy });
    return promise.then(function () {
      // We should not reach this code branch.
      return expect(promise).to.be.rejected;
    }, function (reason) {
      // If the spy was called with only one argument, it should equal the
      // rejection reason. Otherwise, try to match the array of arguments.
      let args = spy.lastCall.args;
      args = args.length === 1 ? args[0] : args;
      expect(spy).to.be.calledOnce;
      expect(args).to.deep.equal(reason);
    });
  };
}

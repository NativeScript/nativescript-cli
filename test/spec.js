/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* jshint browser: true, camelcase: false, node: true, newcap: false */
/* exported Common, expect */

// Configuration.
// --------------

// Set Mocha timeout when ran in Karma. This can only be done here.
if('undefined' !== typeof __karma__) {
  window.mocha.timeout(30000);
}

// Angular.
if('undefined' !== typeof angular) {
  angular.module('angularTestSuite', ['kinvey']).run(function($kinvey) {
    global.Kinvey = $kinvey;
  });
  angular.bootstrap(document, ['angularTestSuite']);
}

// Server: load modules.
if('undefined' !== typeof require && 'undefined' === typeof Titanium) {
  // Patch mocha.
  require('mocha-as-promised')(require('mocha'));

  // Assertion libs.
  var chai = require('chai');
  chai.use(require('chai-as-promised'));// Apply chai-as-promised extension.
  chai.use(require('sinon-chai'));//Apply sinon-chai extension.

  // External libraries.
  global.sinon = require('sinon');

  // Spec files.
  require('./../dist/intermediate/config.js');

  // Source files.
  global.Kinvey = require('./../dist/intermediate/kinvey.js');
}

// Export for both the browser and the server.
var expect = global.expect = chai.expect;

// Setup.
// ------

// Common tests.
var Common = global.Common = {
  // Tests whether both deferreds and callbacks are supported on success.
  success: function(promiseFn) {
    return function() {
      var spy = sinon.spy();
      var promise = promiseFn.call(this, { success: spy }).then(function(value) {
        // If the spy was called with only one argument, it should equal the
        // fulfillment value. Otherwise, try to match the array of arguments.
        var args = spy.lastCall.args;
        args = 1 === args.length ? args[0] : args;

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
        args = 1 === args.length ? args[0] : args;

        expect(spy).to.be.calledOnce;
        expect(args).to.deep.equal(reason);
      });
    };
  }
};

// Test hooks.

// Initialize the library prior to testing. After each test, reset credentials
// in case the test altered them.
before(function() {
  var promise = Kinvey.init({
    appKey    : config.test.appKey,
    appSecret : config.test.appSecret
  });
  return promise.then(null, function(error) {
    // Do not fail if the active user was deleted via the console.
    if(Kinvey.Error.INVALID_CREDENTIALS === error.name) {
      Kinvey.setActiveUser(null);// Reset.
      return null;
    }
    return Kinvey.Defer.reject(error);
  });
});
afterEach(function() {
  Kinvey.appKey    = config.test.appKey;
  Kinvey.appSecret = config.test.appSecret;
});

// Create a test user.
before(function() {
  var _this = this;
  return Kinvey.User.create({}, { state: false }).then(function(user) {
    _this.user = user;
  });
});
after(function() {// Delete the user using its credentials.
  Kinvey.setActiveUser(this.user);
  return Kinvey.User.destroy(this.user._id, { hard: true }).then(function() {
    Kinvey.setActiveUser(null);// Reset.
  });
});
after(function() {// Cleanup.
  delete this.user;
});

// Define test helpers.
before(function() {
  // Helper method to convert a jQuery promise into a `Kinvey.Defer` promise.
  this.jQueryToKinveyPromise = function(jQueryPromise) {
    // Test whether the jQuery promise is really a jQuery promise.
    if('undefined' === typeof jQueryPromise.pipe) {// No, it is not.
      return jQueryPromise;
    }

    // Prepare, convert, and return the response.
    var deferred = Kinvey.Defer.deferred();
    jQueryPromise.then(function() {
      deferred.resolve.call(deferred, Array.prototype.slice.call(arguments));
    }, function() {
      deferred.reject.call(deferred, Array.prototype.slice.call(arguments));
    });
    return deferred.promise;
  };

  // Helper method to return a random string.
  this.randomID = function() {
    return Math.random().toString(36).substring(2);
  };
});
after(function() {// Cleanup.
  delete this.jQueryToKinveyPromise;
  delete this.randomID;
});

// Define a test collection.
before(function() {
  this.collection = 'test-collection'/*- + this.randomID()*/;
});
after(function() {// Cleanup.
  delete this.collection;
});
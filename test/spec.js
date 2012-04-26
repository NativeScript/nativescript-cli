/**
 * Bootstraps tests for browser and CommonJS.
 */
var APP_KEY = 'kid1437';
var APP_SECRET = 'fb784d5502b14c8cbdc1aaa2b72c14a7';
global.COLLECTION_UNDER_TEST = 'test-collection';

// Convenience method to generate options object containing default callbacks.
global.callback = function(done, defaults) {
  defaults || (defaults = {});
  return {
    success: defaults.success || function() {
      done();
    },
    error: defaults.error || function(error) {
      done(new Error(error.error));
    }
  };
};

// Run test suite.
if('undefined' !== typeof require) {// CommonJS
  global.Kinvey = require('./../');// @see "main" in package.json

  // Utilities, only used for testing purposes.
  global.should = require('should');

  Kinvey.init({
    appKey: APP_KEY,
    appSecret: APP_SECRET
  });
}
else {// browser
  global.require = function() {
    // Mock require.
  };

  // Run tests on load.
  global.onload = function() {
    Kinvey.init({
      appKey: APP_KEY,
      appSecret: APP_SECRET
    });
    mocha.run();
  };
}
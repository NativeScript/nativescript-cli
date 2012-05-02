/**
 * Bootstraps tests for browser and CommonJS.
 */
var APP_KEY = 'kid1259';
var APP_SECRET = '498efd9f9c60493f8806516cb824fe20';
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

//Initialization function.
var init = function() {
  Kinvey.init({
   appKey: APP_KEY,
   appSecret: APP_SECRET
  });
};

// Run test suite.
if('undefined' !== typeof require) {// CommonJS
  global.Kinvey = require('./../');// @see "main" in package.json

  // Utilities, only used for testing purposes.
  global.should = require('should');
  init();
}
else {// browser
  global.require = function() {
    // Mock require.
  };

  // Run tests on load.
  global.onload = function() {
    init();
    mocha.run();
  };
}
/**
 * Bootstraps tests for browser and CommonJS.
 */
var APP_KEY = 'kid1131';
var APP_SECRET = '4696ceefee9343a29439e1d1d355e300';

// Run test suite.
if('undefined' !== typeof require) {// CommonJS
  global.Kinvey = require('./../');// @see "main" in package.json
  global.should = require('should');

  Kinvey.init({
    appKey: APP_KEY,
    appSecret: APP_SECRET,
    env: 'node'
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
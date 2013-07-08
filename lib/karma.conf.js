/* global require: true, MOCHA_ADAPTER: true */
/* exported files */

// Import external libraries.
var path = require('path');
var mocha           = path.resolve(require.resolve('mocha'), '../mocha.js');
var mochaAsPromised = require.resolve('mocha-as-promised');
var chai            = path.resolve(require.resolve('chai'),  '../chai.js');
var chaiAsPromised  = require.resolve('chai-as-promised');
var sinon           = path.resolve(require.resolve('sinon'), '../../pkg/sinon.js');

// Files to load, watch, and serve.
// http://karma-runner.github.io/0.8/config/files.html
var files = [
  // Mocha.
  mocha,// Use up-to-date version, mochaAsPromised doesn't work with Karma's MOCHA.
  mochaAsPromised,
  MOCHA_ADAPTER,

  // External libraries.
  chai,
  chaiAsPromised,
  sinon,

  // Source files.
  './../dist/intermediate/dependencies.js',
  './../dist/intermediate/config.js',
  './../dist/intermediate/kinvey.js',
  './../test/spec.js',

  // Spec files.
  './../test/**/*.spec.js'
];
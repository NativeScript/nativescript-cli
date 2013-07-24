/**
 * Copyright 2013 Kinvey, Inc.
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
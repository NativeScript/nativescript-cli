/**
 *  This file contains the variables used in other gulp files
 *  which defines tasks
 *  By design, we only put there very generic config values
 *  which are used in several places to keep good readability
 *  of the tasks
 */

const $ = require('gulp-load-plugins')();
const argv = require('yargs').argv;
const path = require('path');
const isparta = require('isparta');
const assign = require('lodash/object/assign');
const platform = argv.platform || 'node';
const platformConfig = require('./config/' + platform);
const config = {};

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_API_PROTOCOL: 'https',
  KINVEY_API_HOSTNAME: 'baas.kinvey.com',
  KINVEY_API_VERSION: 3,
  KINVEY_INDEXEDDB_LIB: 'fake-indexeddb',
  KINVEY_HTTP_LIB: 'kinvey-http-node',
  KINVEY_PLATFORM_ENV: 'node'
};
config.env = assign(config.env, platformConfig.env);
process.env = assign(process.env, config.env);

/**
 *  The main paths of your project.
 */
config.paths = {
  root: path.join(__dirname, '..'),
  src: path.join(__dirname, '..', 'src'),
  dist: path.join(__dirname, '..', 'dist', config.env.KINVEY_PLATFORM_ENV),
  tmp: path.join(__dirname, '..', 'tmp'),
  test: path.join(__dirname, '..', 'test'),
  coverage: path.join(__dirname, '..', 'coverage')
};
const paths = config.paths = assign(config.paths, platformConfig.paths);

/**
 * The files of your project.
 */
config.files = {
  src: 'src/**/*.js',
  test: 'test/**/*.spec.js',
  entry: {
    fileName: 'index'
  },
  output: {
    fileName: 'kinvey'
  }
};
config.files = assign(config.files, platformConfig.files);

/**
 * Babel is the lib used to transpile ES2015 and beyond into ES5.
 */
config.babel = {
  blacklist: [
    'useStrict'
  ],
  comments: false,
  optional: [
    'runtime',
    'spec.undefinedToVoid',
    'utility.inlineEnvironmentVariables'
  ],
  stage: 2
};
config.babel = assign(config.babel, platformConfig.babel);

/**
 * Browserify is the lib used to link external dependencies to provide the
 * ability to run the library in a browser.
 */
config.browserify = {
  debug: true, // turns on/off creating .map file
  standalone: 'Kinvey'
};
config.browserify = assign(config.browserify, platformConfig.browserify);

/**
 * BrowserySync is the lib used to automatically reload the browser
 * whenever a file chances.
 */
config.browserSync = {
  server: {
    baseDir: [
      './test/',
      './tmp',
      './'
    ],
    index: 'runner.html'
  }
};
config.browserSync = assign(config.browserSync, platformConfig.browserSync);

/**
 * Istanbul is the lib used to create a coverage report the details how
 * much of the source code is being tested.
 */
config.istanbul = {
  config: {
    instrumenter: isparta.Instrumenter,
    includeUntested: true
  },
  report: {
    dir: paths.coverage,
    reporters: ['text', 'text-summary', 'json', 'html']
  },
  thresholds: {
    global: 10
  }
};
config.istanbul = assign(config.istanbul, platformConfig.istanbul);

/**
 * Mocha is the lib used to run unit tests.
 */
config.mocha = {
  reporter: 'spec',
  globals: [
    'stub',
    'spy',
    'expect'
  ],
  slow: 100,
  timeout: 2000
};
config.mocha = assign(config.mocha, platformConfig.mocha);

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
config.errorHandler = function(title) {
  return function errorHandler(err) {
    $.util.log($.util.colors.red('[' + title + ']'), err.toString());
    this.emit('end');
  };
};

// Export
module.exports = config;

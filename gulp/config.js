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
const webpack = require('webpack');
const platform = argv.platform || 'html5';
const platformConfig = require('./config/' + platform);
const config = {};

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_API_PROTOCOL: 'https',
  KINVEY_API_HOST: 'baas.kinvey.com',
  KINVEY_API_VERSION: 3,
  KINVEY_LOKI_ENV: 'BROWSER'
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
    filename: 'kinvey'
  },
  output: {
    filename: 'kinvey'
  }
};
config.files = assign(config.files, platformConfig.files);

/**
 * Webpack is the lib used to link external dependencies to provide the
 * ability to run the library in a browser.
 */
config.webpack = {
  context: config.paths.src,
  entry: './' + config.files.entry.filename,
  output: {
    path: config.paths.dist,
    filename: config.files.output.filename,
    library: 'Kinvey',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /(node_modules|test|gulp)/,
        loader: 'babel',
        query: {
          comments: false,
          presets: ['es2015', 'stage-2']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  target: 'web'
};
config.webpack = assign(config.webpack, platformConfig.webpack);

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

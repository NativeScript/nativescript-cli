'use strict';

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
const config = {
  header: '',
  footer: ''
};
let platformConfig = {};

try {
  platformConfig = require('./config/' + platform);
} catch (err) {
  platformConfig = {};
}

/**
 * Header and footer.
 */
config.header = platformConfig.header || config.header;
config.footer = platformConfig.footer || config.footer;

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_ACL_ATTRIBUTE: '_acl',
  KINVEY_API_PROTOCOL: 'https:',
  KINVEY_API_HOST: 'baas.kinvey.com',
  KINVEY_API_VERSION: 3,
  KINVEY_ACTIVE_USER_COLLECTION: 'kinvey-activeUser',
  KINVEY_CACHE_MIDDLEWARE: path.join(__dirname, '..', 'src', 'rack', 'cache'),
  KINVEY_DATASTORE_NAMESPACE: 'appdata',
  KINVEY_DEFAULT_TIMEOUT: 10000,
  KINVEY_DEVICE_COLLECTION: 'kinvey-device',
  KINVEY_FILE_NAMESPACE: 'blob',
  KINVEY_HTTP_MIDDLEWARE: path.join(__dirname, '..', 'src', 'rack', 'http'),
  KINVEY_ID_ATTRIBUTE: '_id',
  KINVEY_KMD_ATTRIBUTE: '_kmd',
  KINVEY_LOCAL_NAMESPACE: 'local',
  KINVEY_MAX_HEADER_BYTES: 2000,
  KINVEY_MAX_IDS: 200,
  KINVEY_NOTIFICATION_EVENT: 'notification',
  KINVEY_OBJECT_ID_PREFIX: 'local_',
  KINVEY_PARSER_MIDDLEWARE: path.join(__dirname, '..', 'src', 'rack', 'parse'),
  KINVEY_PLATFORM_ENV: platform,
  KINVEY_PUSH_NAMESPACE: 'push',
  KINVEY_RPC_NAMESPACE: 'rpc',
  KINVEY_SERIALIZER_MIDDLEWARE: path.join(__dirname, '..', 'src', 'rack', 'serialize'),
  KINVEY_SYCN_BATCH_SIZE: 1000,
  KINVEY_SYNC_COLLECTION_NAME: 'kinvey-sync',
  KINVEY_SYNC_DEFAULT_STATE: true,
  KINVEY_USERS_NAMESPACE: 'user'
};
config.env = assign(config.env, platformConfig.env);
process.env = assign(process.env, config.env);

/**
 *  The main paths of your project.
 */
config.paths = {
  root: path.join(__dirname, '..'),
  src: path.join(__dirname, '..', 'src'),
  legacy: path.join(__dirname, '..', 'src', 'legacy'),
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
  test: 'test/specs/**/*.js',
  testLegacy: 'test/legacy/**/*.js',
  entry: {
    filename: 'kinvey'
  },
  output: {
    filename: 'kinvey'
  }
};
const files = config.files = assign(config.files, platformConfig.files);

/**
 * Webpack is the lib used to link external dependencies to provide the
 * ability to run the library in a browser.
 */
config.webpack = {
  context: paths.src,
  entry: './' + files.entry.filename,
  output: {
    path: paths.dist,
    filename: files.output.filename,
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
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js']
  },
  target: 'web'
};
config.webpack = assign(config.webpack, platformConfig.webpack);

config.browserify = {
  debug: true, // turns on/off creating .map file
  standalone: 'Kinvey'
};
config.browserify = assign(config.browserify, platformConfig.browserify);

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

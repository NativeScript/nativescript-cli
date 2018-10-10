/* eslint-disable */
const path = require('path');
const fs = require('fs');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');

const DOT_ENV_FILE = path.resolve(__dirname, '.env');

if (!fs.existsSync(DOT_ENV_FILE)) {
  throw new Error(
    '.env file is missing. ' +
    'Please create a .env file that contains the appKey, appSecret, and masterSecret for the application you would like to use for running the integration tests.'
  );
}

function parseTestPattern(argv) {
  let found = false;
  const pattern = argv.map(function (v) {
    if (found) {
      return v;
    }
    if (v === '--') {
      found = true;
    }
  }).
    filter(function (a) { return a }).
    join(' ');
  return pattern ? ['--grep', pattern] : [];
}

module.exports = function (config) {
  config.set({
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'tests/**/*.js'
    ],


    // list of files / patterns to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tests/**/*.js': ['webpack']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress', 'mocha'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // Mocha config
    client: {
      args: parseTestPattern(process.argv),
      mocha: {
        timeout: 10000
      }
    },

    // Webpack config
    webpack: {
      mode: 'development',
      plugins: [
        new Dotenv({
          path: DOT_ENV_FILE
        })
      ]
    },
    webpackMiddleware: {
      stats: 'errors-only'
    }
  });
}

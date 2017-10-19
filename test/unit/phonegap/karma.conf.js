/* eslint-disable */
var path = require('path');
var webpack = require('webpack');

// Example set of browsers to run on Sauce Labs
// Check out https://saucelabs.com/platforms for all browser/platform combos
var customLaunchers = {
  bs_safari_mac: {
    base: 'BrowserStack',
    browser: 'safari',
    browser_version: '10.1',
    os: 'OS X',
    os_version: 'Sierra',
    'browserstack.safari.enablePopups': true
  },
  bs_chrome_mac: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: '61.0',
    os: 'OS X',
    os_version: 'Sierra'
  },
  bs_firefox_mac: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: '56.0',
    os: 'OS X',
    os_version: 'Sierra'
  }
};

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      '**/*.karma.js'
    ],


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.karma.js': ['webpack', 'sourcemap']
    },

    // webpack config
    webpack: {
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader'
            }
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: process.env.CI === true ? ['mocha', 'saucelabs'] : ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['Chrome', 'Firefox', 'Safari'],
    browsers: process.env.CI === true ? Object.keys(customLaunchers) : ['ChromeHeadless' /*, 'Chrome', 'Firefox', 'Safari' */],
    browserDisconnectTimeout: 60000,
    browserNoActivityTimeout: 60000,

    // BrowserStack
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESSKEY,
      project: 'Kinvey PhoneGap SDK',
      name: process.env.TRAVIS_COMMIT,
      video: false
    },
    customLaunchers: customLaunchers,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Mocha options
    client: {
      mocha: {
        timeout: 10000
      }
    }
  })
}

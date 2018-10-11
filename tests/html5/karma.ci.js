/* eslint-disable */
const path = require('path');
const Dotenv = require('dotenv-webpack');

const DOT_ENV_FILE = path.resolve(__dirname, '.env');

module.exports = function (config) {
  config.set({
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'tests/**/*.spec.js'
    ],


    // list of files / patterns to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},


    // test results reporter to use
    // possible values: 'dots', 'progress', 'mocha'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'BrowserStack'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    customLaunchers: {
      // Windows
      bs_windows_chrome_69: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '69.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_windows_firefox_62: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '62.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_windows_ie_11: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '10'
      },
      bs_windows_edge_17: {
        base: 'BrowserStack',
        browser: 'edge',
        browser_version: '17.0',
        os: 'Windows',
        os_version: '10'
      },

      // Mac OS
      bs_macos_chrome_69: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '69.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_macos_firefox_62: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '62.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_macos_safari_11: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '11.1',
        os: 'OS X',
        os_version: 'High Sierra'
      },

      // iOS
      bs_ios_11: {
        base: 'BrowserStack',
        device: 'iPhone X',
        os: 'ios',
        os_version: '11.0',
        real_mobile: true
      },

      // Android
      bs_android_9: {
        base: 'BrowserStack',
        device: 'Google Pixel 2',
        os: 'android',
        os_version: '9.0',
        real_mobile: true
      }
    },
    browsers: [
      // Windows
      // 'bs_windows_chrome_69',
      // 'bs_windows_firefox_62',
      // 'bs_windows_ie_11',
      // 'bs_windows_edge_17',

      // Mac OS
      'bs_macos_chrome_69',
      'bs_macos_firefox_62',
      'bs_macos_safari_11',

      // iOS
      // 'bs_ios_11',

      // Android
      // 'bs_android_9'
    ],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // Mocha config
    client: {
      mocha: {
        timeout: 10000
      }
    },

    // BrowserStack
    browserStack: {
      username: 'kinveymobileteam1',
      accessKey: 'EGfszrX4Lx9uykWsqPHX',
      project: 'Kinvey JavaScript SDK',
      name: 'HTML5',
      build: process.env.TRAVIS_BUILD_NUMBER,
      captureTimeout: 600,
      timeout: 600
    }
  });
}

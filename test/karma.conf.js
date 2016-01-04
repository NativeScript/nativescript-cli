// Karma configuration
module.exports = function(config) {
  // Browsers to run on Sauce Labs
  // Check out https://saucelabs.com/platforms for all browser/OS combos
  const customLaunchers = {
    iOS92: {
      base: 'SauceLabs',
      platform: 'OS X 10.11',
      browserName: 'iphone',
      version: '9.2'
    },
    iOS91: {
      base: 'SauceLabs',
      platform: 'OS X 10.11',
      browserName: 'iphone',
      version: '9.1'
    },
    iOS90: {
      base: 'SauceLabs',
      platform: 'OS X 10.11',
      browserName: 'iphone',
      version: '9.0'
    },
    Android44: {
      base: 'SauceLabs',
      platform: 'Linux',
      browserName: 'android',
      deviceName: 'Samsung Galaxy S3 Emulator',
      version: '4.4'
    }

    // 'SL_Chrome': {
    //   base: 'SauceLabs',
    //   platform: 'OS X 10.11',
    //   browserName: 'chrome',
    //   customData: {
    //     awesome: true
    //   }
    // },
    // 'SL_Firefox': {
    //   base: 'SauceLabs',
    //   platform: 'OS X 10.11',
    //   browserName: 'firefox'
    // }
  };

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha', 'chai'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'src/**/*.js',
      'test/setup/setup.js',
      'test/specs/**/*.js'
    ],

    // list of files to exclude
    exclude: [
      'src/shims/**/*.js'
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': ['browserify'],
      'test/setup/setup.js': ['browserify'],
      'test/specs/**/*.js': ['browserify']
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Configure browserify preprocessor
    browserify: {
      debug: true,
      transform: [
        ['babelify', {
          global: true,
          ignore: /\/node_modules\/(?!qs\/)/ // Ignore all node_modules except qs
        }],
        'envify'
      ]
    },

    // SauceLabs
    // Used to run unit tests on several browsers
    sauceLabs: {
      username: 'MobileKinvey',
      accessKey: '985610da-2716-441b-b0bd-9a3c570ec31b',
      testName: 'Kinvey JavaScript Library Unit Tests'
    },
    customLaunchers: customLaunchers,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: [
    //   'Chrome',
    //   'PhantomJS'
    // ],
    browsers: Object.keys(customLaunchers),

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Increase timeout in case connection in CI is slow
    captureTimeout: 120000
  });
};

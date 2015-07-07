var path = require('path');
var isparta = require('isparta');
var deepMerge = require('deep-merge')(function(target, source) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

// Setup Environment
process.env.API_PROTOCOL = 'https';
process.env.API_HOSTNAME = 'baas.kinvey.com';
process.env.API_VERSION = 3;

// Default config
var defaultConfig = {
  babelify: {
    blacklist: ['useStrict'],
    code: true,
    comments: false,
    optional: [
      'runtime',
      'spec.undefinedToVoid',
      'utility.inlineEnvironmentVariables'
    ],
    stage: 2
  },
  browserify: {
    debug: true,
    standalone: 'Kinvey'
  },
  coverage: {
    istanbul: {
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    },
    report: {
      dir: path.join(__dirname, '../coverage'),
      reporters: ['text', 'text-summary', 'json', 'html']
    }
  },
  entry: path.join(__dirname, '../src/index.js'),
  mocha: {
    slow: 100,
    timeout: 2000
  },
  outputFile: 'kinvey.js',
  outputMinFile: 'kinvey.min.js',
  srcFiles: 'src/**/*.js',
  testFiles: 'test/specs/**/*.spec.js'
};

// if (process.env.NODE_ENV !== 'production') {
//   defaultConfig.webpack.devtool = 'source-map';
//   defaultConfig.webpack.debug = true;
// }

function config(overrides) {
  return deepMerge(defaultConfig, overrides || {});
}

// Export
module.exports = config;

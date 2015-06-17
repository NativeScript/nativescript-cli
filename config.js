/*eslint-disable*/

var path = require('path');
var fs = require('fs');
var src = path.join(__dirname, 'src/**/*.js');
var DeepMerge = require('deep-merge');
var deepmerge = DeepMerge(function(target, source) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});
var defaultConfig = {
  babel: {
    code: true,
    comments: false,
    optional: [
      'runtime',
      'spec.undefinedToVoid'
    ],
    stage: 2
  },
  browserify: {
    noParse: [
      'clone'
    ],
    outputName: 'kinvey.js',
    standalone: 'Kinvey'
  },
  releaseName: 'kinvey.min.js',
  preprocess: {
    context: {
      API_PROTOCOL: 'https:',
      API_HOSTNAME: 'baas.kinvey.com'
    }
  },
  src: [
    src
  ]
};

// if (process.env.NODE_ENV !== 'production') {
//   defaultConfig.webpack.devtool = 'source-map';
//   defaultConfig.webpack.debug = true;
// }

function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}

module.exports = config;

/*eslint-disable*/

var config = require('./config');
var path = require('path');
var build = path.join(__dirname, 'build/node');
var entry = path.join(build, 'export.js');
var dist = path.join(__dirname, 'dist/node');
var test = path.join(__dirname, 'test/node');
var karmaConfig = path.join(test, 'karma.conf.js');

module.exports = config({
  browserify: {
    entries: entry,
    dest: dist
  },
  build: build,
  dist: dist,
  preprocess: {
    context: {
      DATABASE_LIB: 'fake-indexeddb',
      HTTP_LIB: 'kinvey-http-node',
      PLATFORM_ENV: 'node'
    }
  },
  test: {
    karmaConfig: karmaConfig
  }
});

/*eslint-disable*/

var config = require('./config');
var path = require('path');
var build = path.join(__dirname, 'build/html5');
var entry = path.join(build, 'export.js');
var dist = path.join(__dirname, 'dist/html5');
var test = path.join(__dirname, 'test/html5');
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
      DATABASE_LIB: 'indexeddbshim',
      HTTP_LIB: 'kinvey-http-xhr',
      PLATFORM_ENV: 'html5'
    }
  },
  test: {
    karmaConfig: karmaConfig
  }
});

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
      HTTP_LIB: 'kinvey-http-xhr'
    }
  },
  test: {
    karmaConfig: karmaConfig
  }
});

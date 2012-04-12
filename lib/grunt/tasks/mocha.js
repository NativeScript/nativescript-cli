/**
 * Grunt task for running mocha tests.
 * 
 * @example <code>
 * grunt.initConfig({
 *   mocha: {
 *     test: ['foo.js', 'bar.js']
 *   },
 *   mochaOptions: {// @see http://visionmedia.github.com/mocha/
 *     globals: '...',
 *     grep: '...',
 *     growl: '...',
 *     ignoreLeaks: '...',
 *     reporter: '...',
 *     timeout: '...',
 *     ui: '...'
 *   }
 * });
 * </code>
 * 
 * Inspired by @link https://gist.github.com/2361303.
 */
module.exports = function(grunt) {
  // Utilities.
  var Mocha = require('mocha');
  var path = require('path');

  // Define task.
  grunt.registerMultiTask('mocha', 'Run tests with mocha.', function() {
    // Load dependencies.
    var dependencies = grunt.file.expandFiles(this.data.require);
    grunt.file.clearRequireCache(dependencies);
    dependencies.map(function(file) {
      require(path.resolve(file));
    });

    // Create list of absolute paths to test files.
    var files = grunt.file.expandFiles(this.file.src);
    grunt.file.clearRequireCache(files);
    var paths = files.map(function(file) {
      return path.resolve(file);
    });

    // Get options.
    var options = grunt.config.get('mochaOptions') || {};

    // Run tests.
    var done = this.async();// run tests asynchronously

    var mocha = new Mocha(options);
    paths.map(mocha.addFile.bind(mocha));// add test files
    mocha.run(function(failures) {
      // Tests are completed. Pass success flag as argument.
      done(0 === failures);
    });
  });
};
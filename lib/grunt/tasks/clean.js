/**
 * Grunt task for cleaning directories and files.
 * 
 * @example <code>
 * grunt.initConfig({
 *   clear: ['foo/', 'bar.js']
 * });
 * </code>
 */
module.exports = function(grunt) {
  // Utilities.
  var rimraf = require('rimraf');

  // Define task.
  grunt.registerMultiTask('clean', 'Clean files.', function() {
    var i = 0;

    // Remove one by one.
    this.file.src.map(function(file) {
      try {
        rimraf.sync(file);
        i += 1;
      }
      catch(e) {//error out
        grunt.warn(e, 3);
      }
    });
    grunt.log.writeln(i + ' files cleaned.');
  });
};
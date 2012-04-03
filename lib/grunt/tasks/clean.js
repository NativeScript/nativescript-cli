/**
 * Defines grunt task for file cleanup
 * 
 */
module.exports = function(grunt) {
  // Utilities
  var rimraf = require('rimraf');

  // Define task
  grunt.registerMultiTask('clean', 'Clean files and directories', function() {
    // Clear
    var length = this.file.src.length;
    for(file in this.file.src) {
      try {
        rimraf.sync(this.file.src[file]);
      }
      catch(e) {//error out
        grunt.warn(e, 3);
      }
    }

    // Done
    grunt.log.writeln(length + ' files cleaned.');
  });  
};
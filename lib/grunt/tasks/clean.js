/**
 * Defines grunt task for file cleanup
 * 
 */
module.exports = function(grunt) {
  // Grunt utilities
  var rimraf = require('rimraf');

  // Define task
  grunt.registerMultiTask('clean', 'Clean files and directories', function() {
    // Clear
    var removed = 0;
    for(file in this.file.src) {
      try {
        rimraf.sync(this.file.src[file]);
        removed += 1;
      }
      catch(e) {//error out
        grunt.warn(e, 3);
      }
    }

    // Done
    grunt.log.writeln(removed + ' files cleaned.');
  });  
};
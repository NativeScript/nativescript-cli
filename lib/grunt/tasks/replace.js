/**
 * Defines grunt task for replacing content in a file
 * 
 */
module.exports = function(grunt) {
  // Grunt utilities
  var task = grunt.task;
  var file = grunt.file;
  var log = grunt.log;

  // Define task
  grunt.registerMultiTask('replace', 'Replace content', function() {
    var dest = this.file.dest || this.file.src;//if edit in place, use src

    // Perform replacement
    var content = task.directive(this.file.src, file.read)
                      .replace(this.data.find, this.data.replace || '');

    // Save
    file.write(dest, content);

    // Fail task if errors were logged.
    if (this.errorCount) { return false; }

    // Otherwise, print a success message.
    log.writeln('File "' + dest + '" created.');
  });

};
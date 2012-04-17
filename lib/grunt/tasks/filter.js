/**
 * Grunt task for find/replace in files.
 * 
 * @example <code>
 * grunt.initConfig({
 *   replace: {
 *     fooByBar: {
 *       src: 'baz.js',
 *       dest: 'qux.js',// optional
 *       find: /foo/,
 *       replace: 'bar'// optional
 *     }
 *   }
 * });
 * </code>
 */
module.exports = function(grunt) {
  // Define task.
  grunt.registerMultiTask('filter', 'Find/replaces file content.', function() {
    // Set destination file.
    var dest = this.file.dest || this.file.src;

    // Find ... and replace.
    var content = grunt.task.directive(this.file.src, grunt.file.read);
    content = grunt.template.process(content);
    // content = content.replace(this.data.find, grunt.template.process(this.data.replace || ''));

    // Save to destination.
    grunt.file.write(dest, content);

    // Check for errors.
    if(this.errorCount) {
      return false;
    }
    grunt.log.writeln('File "' + dest + '" created.');
  });
};
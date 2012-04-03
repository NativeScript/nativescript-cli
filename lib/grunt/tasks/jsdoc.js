/**
 * Defines grunt task for JSDoc API documentation
 * 
 */
module.exports = function(grunt) {
  // Utilities
  var jsdoc = require('jsdoc-toolkit/app/nodemodule.js').jsdoctoolkit;
  var path = require('path');

  // Define task
  grunt.registerMultiTask('apidoc', 'Generate API docs using JSDoc3', function() {
    // Validate arguments
    if('undefined' === typeof this.file.src) {
      grunt.warn('No source files specified', 91);
      return false;
    }
    if('undefined' === typeof this.file.dest) {
      grunt.warn('No target directory specified', 91);
      return false;
    }

    // Get module directory
    var dir = path.dirname(require.resolve('jsdoc-toolkit/app/nodemodule.js'));
    var tpl = dir + '/../templates/jsdoc';

    // Parse arguments
    var args = this.file.src;
    args.unshift(
      '-d=' + this.file.dest,
      '-s',
      '-t=' + tpl
    );

    // Run toolkit
    jsdoc.run(args);

    // Done
    grunt.log.writeln('API documentation "' + this.file.dest + '" created.');
  });  
};
/**
 * Grunt task for generating an API Reference, using JSDoc.
 * 
 * @example <code>
 * grunt.initConfig({
 *   jsdoc: {
 *     component: {
 *       src: 'foo.js',
 *       dest: 'bar/'
 *     }
 *   }
 * });
 * </code>
 */
module.exports = function(grunt) {
  // Utilities.
  var JSDoc = require('jsdoc-toolkit/app/nodemodule.js').jsdoctoolkit;
  var path = require('path');

  // Define task.
  grunt.registerMultiTask('jsdoc', 'Generate API docs using JSDoc3.', function() {
    if('undefined' === typeof this.file.src) {
      grunt.warn('No source files specified', 91);
      return false;
    }
    if('undefined' === typeof this.file.dest) {
      grunt.warn('No target directory specified', 91);
      return false;
    }

    // Force reload of JSDoc module. This is not the recommended way to do this,
    // but as a quick fix it works.
    delete require.cache[require.resolve('jsdoc-toolkit/app/run.js')];

    // Get template directory.
    var tplPath = path.dirname(require.resolve('jsdoc-toolkit/app/nodemodule.js'));
    tplPath += '/../templates/jsdoc';

    // Run generator.
    JSDoc.run([
      '-d=' + this.file.dest,
      '-s',// exclude actual source code
      '-t=' + tplPath,
      this.file.src
    ]);
    grunt.log.writeln('Generated API docs in "' + this.file.dest + '".');
  });
};
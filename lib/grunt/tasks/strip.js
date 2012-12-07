/**
 * Grunt task for stripping IIFE-closures from files.
 * 
 */ 
module.exports = function(grunt) {
  // Predefine regular expressions.
  var regex = [
    {
      find: /^(\(function\(\) \{)$|^(\}\(\)\)\;)$/gm,
      replace: ''
    },
    {
      find: /\n{3,}/g,
      replace: '\n\n'
    },
    {
      find: /\n(\(function\(undefined\) \{)/g,
      replace: '$1'
    },
    {
      find: /^\(function\(e\)/m,
      replace: '(function(undefined)'
    }
  ];

  // Define task.
  grunt.registerMultiTask('strip', 'Strips IIFE-closures from files.', function() {
    var files = grunt.file.expandFiles(this.data);
    files.forEach(function(filename) {
      // Find and replace.
      var content = grunt.task.directive(filename, grunt.file.read);
      regex.forEach(function(r) {
        content = content.replace(r.find, r.replace);
      });
  
      // Save in place.
      grunt.file.write(filename, content);
      grunt.log.writeln('File "' + filename + '" stripped.');
    });

    // Check for errors.
    if(this.errorCount) {
      return false;
    }
  });

};
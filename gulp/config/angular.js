const config = {};

/**
 * Intro and outro that wraps the library.
 */
config.header = '' +
'// Define the Angular.js Kinvey module.\n' +
'var module = angular.module(\'kinvey\', []);\n' +
'module.factory(\'$kinvey\', [\'$http\', function($http) {\n';

config.footer = '' +
'  return Kinvey;\n' +
'}]);\n';

// Export
module.exports = config;

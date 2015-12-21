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

/**
 * Override Environment variables for the project.
 */
config.env = {
  KINVEY_HTTP_MIDDLEWARE: './shims/angular/http'
};

// Export
module.exports = config;

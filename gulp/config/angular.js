const fs = require('fs');
const path = require('path');
const config = {};

/**
 * Environment variables for the project.
 */
config.env = {
  KINVEY_INDEXEDDB_LIB: 'indexeddbshim',
  KINVEY_HTTP_LIB: 'kinvey-http-angular',
  KINVEY_PLATFORM_ENV: 'angular'
};

/**
 * Intro and outro that wraps the library.
 */
config.intro = fs.readFileSync(path.join(__dirname, './angular/intro.js'));
config.outro = fs.readFileSync(path.join(__dirname, './angular/outro.js'));

// Export
module.exports = config;

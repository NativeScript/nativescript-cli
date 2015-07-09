var config = require('./config');
var path = require('path');

// Setup Environment
process.env.DATABASE_LIB = 'indexeddbshim';
process.env.HTTP_LIB = 'kinvey-http-xhr';
process.env.PLATFORM_ENV = 'html5';

// Config
module.exports = config({
  buildDirectory: path.join(__dirname, '../build', process.env.PLATFORM_ENV),
  distDirectory: path.join(__dirname, '../dist', process.env.PLATFORM_ENV)
});

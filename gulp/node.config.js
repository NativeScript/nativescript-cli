var config = require('./config');
var path = require('path');

// Setup Environment
process.env.DATABASE_LIB = 'fake-indexeddb';
process.env.HTTP_LIB = 'kinvey-http-node';
process.env.PLATFORM_ENV = 'node';

// Config
module.exports = config({
  buildDirectory: path.join(__dirname, '../build', process.env.PLATFORM_ENV),
  distDirectory: path.join(__dirname, '../dist', process.env.PLATFORM_ENV)
});

var config = require('./config');
var path = require('path');

// Setup Environment
process.env.DATABASE_LIB = 'indexeddbshim';
process.env.HTTP_LIB = 'kinvey-http-xhr';
process.env.PLATFORM_ENV = 'html5';

// Config
module.exports = config({
  distDirectory: path.join(__dirname, '../dist/html5')
});

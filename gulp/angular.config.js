var config = require('./config');
var path = require('path');
var fs = require('fs');

// Setup Environment
process.env.DATABASE_LIB = 'indexeddbshim';
process.env.HTTP_LIB = 'kinvey-http-angular';
process.env.PLATFORM_ENV = 'angular';

// Config
module.exports = config({
  buildDirectory: path.join(__dirname, '../build', process.env.PLATFORM_ENV),
  distDirectory: path.join(__dirname, '../dist', process.env.PLATFORM_ENV),
  intro: fs.readFileSync(path.join(__dirname, './angular/intro.js')),
  outro: fs.readFileSync(path.join(__dirname, './angular/outro.js'))
});

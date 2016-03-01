/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

require('babel-register')({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: /\/node_modules\/(?!qs\/)/
});
const gulp = require('gulp');
const wrench = require('wrench');

// This will load all js or coffee files in the gulp directory
// in order to load all gulp tasks
wrench.readdirSyncRecursive('./gulp/tasks').filter(function cb(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function cb(file) {
  require('./gulp/tasks/' + file);
});

// An alias of test
gulp.task('default', ['test']);

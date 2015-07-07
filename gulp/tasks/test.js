'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
  require('babel/register');
  return gulp.src(config.testFiles, {read: false})
    .pipe($.mocha(config.mocha))
    .once('error', function() {
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

gulp.task('watch-test', function() {
  gulp.watch([config.srcFiles, config.testFiles], 'test');
});

gulp.task('test-user', ['lint-src', 'lint-test'], function() {
  require('babel/register');
  return gulp.src('test/specs/user.spec.js', {read: false})
    .pipe($.mocha(config.mocha))
    .once('error', function() {
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

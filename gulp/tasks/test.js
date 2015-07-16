'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

// Lint and run our tests
gulp.task('test', [], function() {
  require('babel/register');
  return gulp.src(config.testFiles, {read: false})
    .pipe($.mocha(config.mocha))
    .once('error', function(err) {
      console.error(err);
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

gulp.task('watch-test', function() {
  gulp.watch([config.srcFiles, config.testFiles], 'test');
});

gulp.task('test-request', ['lint-test'], function() {
  require('babel/register');
  return gulp.src('test/specs/request.spec.js', {read: false})
    .pipe($.mocha(config.mocha))
    .once('error', function(err) {
      console.log(err);
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

gulp.task('test-user', ['lint-test'], function() {
  require('babel/register');
  return gulp.src('test/specs/user.spec.js', {read: false})
    .pipe($.mocha(config.mocha))
    .once('error', function(err) {
      console.log(err);
      process.exit(1);
    })
    .once('end', function() {
      process.exit();
    });
});

'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

// Send a notification when JSRC fails,
// so that you know your changes didn't build
function jscsNotify(file) {
  if (!file.jscs) { return false; }
  return file.jscs.success ? false : 'JSRC failed';
}

function createLintTask(taskName, files) {
  gulp.task(taskName, function() {
    return gulp.src(files)
      .pipe($.plumber())
      .pipe($.eslint())
      .pipe($.eslint.format())
      .pipe($.eslint.failOnError())
      .pipe($.jscs())
      .pipe($.notify(jscsNotify));
  });
}

// Lint our source code
createLintTask('lint-src', config.srcFiles);

// Lint our test code
createLintTask('lint-test', config.testFiles);

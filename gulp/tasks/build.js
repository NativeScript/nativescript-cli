'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

gulp.task('build', ['lint-src', 'clean'], function() {
  return browserify(config.browserify)
    .transform(babelify.configure(config.babelify))
    .require(config.entry, { entry: true })
    .bundle()
    .pipe($.plumber())
    .pipe(source(config.outputFile))
    .pipe(gulp.dest(config.distDirectory))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.uglify())
    .pipe($.rename(config.outputMinFile))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(config.distDirectory));
});

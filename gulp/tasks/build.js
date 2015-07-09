'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var path = require('path');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

gulp.task('build', function(done) {
  runSequence(['lint-src', 'clean'], 'browserify', 'wrap', done);
});

gulp.task('browserify', function() {
  return browserify(path.join(config.srcDirectory, config.entryFile), config.browserify)
    .transform(babelify.configure(config.babelify))
    .bundle()
    .pipe($.plumber())
    .pipe(source(config.outputFile))
    // .pipe(gulp.dest(config.distDirectory))
    // .pipe(buffer())
    // .pipe($.sourcemaps.init({loadMaps: true}))
    // .pipe($.uglify())
    // .pipe($.rename(config.outputMinFile))
    // .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(config.distDirectory));
});

gulp.task('wrap', function() {
  return gulp.src(path.join(config.distDirectory, config.outputFile))
    .pipe($.insert.wrap(config.intro, config.outro))
    .pipe(gulp.dest(config.distDirectory));
});

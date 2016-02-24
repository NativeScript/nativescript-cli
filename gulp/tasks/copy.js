const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const del = require('del');
const path = require('path');
const config = require('../config');
const errorHandler = config.errorHandler('copy');

gulp.task('clean-core', function(done) {
  return del([path.join(config.paths.dist, 'src/core')], done);
});

gulp.task('copy', ['clean-core'], function () {
  return gulp.src(path.join(config.paths.src, '**/*.js'))
    .pipe($.plumber())
    .pipe(gulp.dest(path.join(config.paths.dist, 'src/core')))
    .on('error', errorHandler);
});

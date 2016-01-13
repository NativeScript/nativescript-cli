const gulp = require('gulp');
const del = require('del');
const config = require('../config');

// Remove the built files
gulp.task('clean', function (done) {
  return del([config.paths.dist], done);
});

gulp.task('clean-legacy', function (done) {
  return del([config.paths.legacy.dist], done);
});

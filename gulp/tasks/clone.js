const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const del = require('del');
const config = require('../config');
const errorHandler = config.errorHandler('release');

gulp.task('clean', function (done) {
  return del([config.paths.dist], done);
});

gulp.task('clone', ['clean'], function (done) {
  $.git.clone(config.git, { args: config.paths.dist }, function (err) {
    if (err) {
      errorHandler(err);
    }

    done(err);
  });
});

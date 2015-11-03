const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');
const test = require('./test').test;
const errorHandler = config.errorHandler('coverage');

gulp.task('coverage', ['lint-src', 'lint-test'], function(done) {
  require('babel-core/register');
  gulp.src(config.files.src)
    .pipe($.istanbul(config.istanbul.config))
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      return test(['test/setup/node.js', config.files.test])
      .pipe($.istanbul.writeReports(config.istanbul.reports))
      .pipe($.istanbul.enforceThresholds({ thresholds: config.istanbul.thresholds }))
      .on('error', errorHandler)
      .on('end', done);
    });
});

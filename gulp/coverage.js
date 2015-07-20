const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const config = require('./config');
const test = require('./test').test;
const errorHandler = config.errorHandler('coverage');

gulp.task('coverage', ['lint-src', 'lint-test'], function(done) {
  require('babel/register');
  gulp.src(config.files.src)
    .pipe($.istanbul(config.istanbul.config))
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      return test()
      .pipe($.istanbul.writeReports(config.istanbul.reports))
      .pipe($.istanbul.enforceThresholds({ thresholds: config.istanbul.thresholds }))
      .on('error', errorHandler)
      .on('end', done);
    });
});

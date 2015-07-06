var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

gulp.task('coverage', function(done) {
  require('babel/register');
  gulp.src(config.srcFiles)
    .pipe($.istanbul(config.coverage.istanbul))
    .pipe($.istanbul.hookRequire())
    .on('finish', function() {
      gulp.src(config.testFiles, {read: false})
        .pipe($.mocha(config.mocha))
        .pipe($.istanbul.writeReports(config.coverage.report))
        //.pipe($.istanbul.enforceThresholds({thresholds: {global: 90}}))
        .on('end', done);
    });
});

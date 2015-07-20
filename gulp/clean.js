const gulp = require('gulp');
const del = require('del');
const config = require('./config');

// Remove the built files
gulp.task('clean', function(done) {
  del([config.paths.dist], done);
});

// Remove our temporary files
gulp.task('clean-tmp', function(done) {
  del([config.paths.tmp], done);
});

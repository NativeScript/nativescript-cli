const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

const test = module.exports.test = function(files) {
  return gulp.src(files, {read: false})
    .pipe($.mocha(config.mocha));
};

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
  require('babel/register');
  return test(['test/setup/node.js', config.files.test]);
});

gulp.task('test-request', ['lint-src', 'lint-test-request'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/request.spec.js']);
});

gulp.task('test-user', ['lint-src', 'lint-test-user'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/user.spec.js']);
});

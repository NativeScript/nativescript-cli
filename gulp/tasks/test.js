const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

const test = module.exports.test = function() {
  return gulp.src(['test/setup/node.js', config.files.test], {read: false})
    .pipe($.mocha(config.mocha));
};

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
  require('babel/register');
  return test();
});

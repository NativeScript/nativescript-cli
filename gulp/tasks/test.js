const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const assign = require('lodash/object/assign');
const config = require('../config');

const test = module.exports.test = function(files) {
  if (process.env.user === 'jenkins' || process.env.USER === 'jenkins') {
    config.mocha = assign(config.mocha, {
      reporter: 'mocha-jenkins-reporter',
      reporterOptions: {
        'junit_report_name': 'Tests',
        'junit_report_path': 'report.xml',
        'junit_report.stack': 1
      }
    });
  }

  return gulp.src(files, {read: false})
    .pipe($.mocha(config.mocha));
};

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
  require('babel/register');
  return test(['test/setup/node.js', config.files.test]);
});

gulp.task('test-database', ['lint-src', 'lint-test-database'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/database.spec.js']);
});

gulp.task('test-query', ['lint-src', 'lint-test-query'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/query.spec.js']);
});

gulp.task('test-request', ['lint-src', 'lint-test-request'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/request.spec.js']);
});

gulp.task('test-user', ['lint-src', 'lint-test-user'], function() {
  require('babel/register');
  return test(['test/setup/node.js', 'test/specs/user.spec.js']);
});

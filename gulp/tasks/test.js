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
  require('babel-register');
  return test(['test/setup.js', config.files.test]);
});

gulp.task('test-acl', ['lint-src', 'lint-test-acl'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/acl.spec.js']);
});

gulp.task('test-collection', ['lint-src', 'lint-test-collection'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/collection.spec.js']);
});

gulp.task('test-indexeddb', ['lint-src', 'lint-test-indexeddb'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/indexeddb.spec.js']);
});

gulp.task('test-query', ['lint-src', 'lint-test-query'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/query.spec.js']);
});

gulp.task('test-request', ['lint-src', 'lint-test-request'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/request.spec.js']);
});

gulp.task('test-sync', ['lint-src', 'lint-test-sync'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/sync.spec.js']);
});

gulp.task('test-user', ['lint-src', 'lint-test-user'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/specs/user.spec.js']);
});

// Lint and run legacy tests
gulp.task('test-legacy', ['lint-src', 'lint-test-legacy'], function() {
  require('babel-register');
  return test(['test/setup.js', config.files.testLegacy]);
});

gulp.task('test-legacy-acl', ['lint-src', 'lint-test-legacy-acl'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/legacy/acl.spec.js']);
});

gulp.task('test-legacy-datastore', ['lint-src', 'lint-test-legacy-datastore'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/legacy/datastore.spec.js']);
});

gulp.task('test-legacy-file', ['lint-src', 'lint-test-legacy-file'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/legacy/file.spec.js']);
});

gulp.task('test-legacy-user', ['lint-src', 'lint-test-legacy-user'], function() {
  require('babel-register');
  return test(['test/setup.js', 'test/legacy/user.spec.js']);
});

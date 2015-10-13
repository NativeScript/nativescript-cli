const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

function createLintTask(taskName, files) {
  gulp.task(taskName, function() {
    return gulp.src(files)
      .pipe($.plumber())
      .pipe($.eslint())
      .pipe($.eslint.format())
      .pipe($.eslint.failOnError())
      .pipe($.jscs());
  });
}

// Lint our source code
createLintTask('lint-src', config.files.src);

// Lint our test code
createLintTask('lint-test', config.files.test);
createLintTask('lint-test-acl', 'test/specs/acl.spec.js');
createLintTask('lint-test-datastore', 'test/specs/datastore.spec.js');
createLintTask('lint-test-indexeddb', 'test/specs/indexeddb.spec.js');
createLintTask('lint-test-query', 'test/specs/query.spec.js');
createLintTask('lint-test-request', 'test/specs/request.spec.js');
createLintTask('lint-test-user', 'test/specs/user.spec.js');

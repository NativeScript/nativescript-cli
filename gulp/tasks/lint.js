const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

function createLintTask(taskName, files) {
  gulp.task(taskName, function() {
    return gulp.src(files)
      .pipe($.jscs())
      .pipe($.eslint())
      .pipe($.eslint.format());
  });
}

// Lint our source code
createLintTask('lint-src', config.files.src);

// Lint our test code
createLintTask('lint-test', config.files.test);
createLintTask('lint-test-acl', 'test/specs/acl.spec.js');
createLintTask('lint-test-collection', 'test/specs/collection.spec.js');
createLintTask('lint-test-indexeddb', 'test/specs/indexeddb.spec.js');
createLintTask('lint-test-query', 'test/specs/query.spec.js');
createLintTask('lint-test-request', 'test/specs/request.spec.js');
createLintTask('lint-test-user', 'test/specs/user.spec.js');

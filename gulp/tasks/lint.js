const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

function createLintTask(taskName, files) {
  gulp.task(taskName, function () {
    return gulp.src(files)
      .pipe($.eslint())
      .pipe($.eslint.format())
      .pipe($.eslint.failAfterError());
  });
}

// Lint our source code
createLintTask('lint', config.files.src);

// Lint our test code
createLintTask('lint-test', config.files.test);
createLintTask('lint-test-store', 'test/specs/store.spec.js');

// Lint legacy test code
createLintTask('lint-legacy-test', config.files.testLegacy);
createLintTask('lint-legacy-test-acl', 'test/legacy/acl.spec.js');
createLintTask('lint-legacy-test-datastore', 'test/legacy/datastore.spec.js');
createLintTask('lint-legacy-test-file', 'test/legacy/file.spec.js');
createLintTask('lint-legacy-test-user', 'test/legacy/user.spec.js');

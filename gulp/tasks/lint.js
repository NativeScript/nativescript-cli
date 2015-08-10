const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');

// Send a notification when JSRC fails,
// so that you know your changes didn't build
function jscsNotify(file) {
  if (!file.jscs) return;
  return file.jscs.success ? false : 'JSRC failed';
}

function createLintTask(taskName, files) {
  gulp.task(taskName, function() {
    return gulp.src(files)
      .pipe($.plumber())
      .pipe($.eslint())
      .pipe($.eslint.format())
      .pipe($.eslint.failOnError())
      .pipe($.jscs())
      .pipe($.notify(jscsNotify));
  });
}

// Lint our source code
createLintTask('lint-src', config.files.src);

// Lint our test code
createLintTask('lint-test', config.files.test);
createLintTask('lint-test-request', 'test/specs/request.spec.js');
createLintTask('lint-test-user', 'test/specs/user.spec.js');

/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

const gulp = require('gulp');
const wrench = require('wrench');
const runSequence = require('run-sequence');

// This will load all js or coffee files in the gulp directory
// in order to load all gulp tasks
wrench.readdirSyncRecursive('./gulp/tasks').filter(function cb(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function cb(file) {
  require('./gulp/tasks/' + file);
});

// Ensure that linting occurs before build runs. This prevents
// the build from breaking due to poorly formatted code.
gulp.task('build-release-sequence', function(done) {
  runSequence(['lint-src', 'lint-test'], 'test', 'build-release', done);
});
gulp.task('build-legacy-release-sequence', function(done) {
  runSequence(['lint-src', 'lint-legacy-test'], 'test-legacy', 'build-legacy-release', done);
});

// Run the headless unit tests as you make changes.
const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc', '.jscsrc'];
gulp.task('watch', function cb() {
  gulp.watch(watchFiles, ['test']);
});

// Release
gulp.task('release', ['build-release-sequence', 'docs']);
gulp.task('release-legacy', ['build-legacy-release', 'docs']);

// An alias of test
gulp.task('default', ['test']);

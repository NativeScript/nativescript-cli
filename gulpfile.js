/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

const gulp = require('gulp');
const wrench = require('wrench');
const runSequence = require('run-sequence');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
wrench.readdirSyncRecursive('./gulp/tasks').filter(function cb(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function cb(file) {
  require('./gulp/tasks/' + file);
});

// Ensure that linting occurs before build runs. This prevents
// the build from breaking due to poorly formatted code.
gulp.task('build-in-sequence', function cb(done) {
  runSequence(['lint-src', 'lint-test'], 'build', done);
});

const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc', '.jscsrc'];

// Run the headless unit tests as you make changes.
gulp.task('watch', function cb() {
  gulp.watch(watchFiles, ['test']);
});

// An alias of test
gulp.task('default', ['test']);

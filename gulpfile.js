<<<<<<< Updated upstream
'use strict';

/*
  gulpfile.js
  ===========
  Rather than manage one giant configuration file responsible
  for creating multiple tasks, each task has been broken out into
  its own file in gulp/tasks. Any files in that directory get
  automatically required below.

  To add a new task, simply add a new task file that directory.
  gulp/tasks/default.js specifies the default set of tasks to run
  when you run `gulp`.
*/

var requireDir = require('require-dir');

// Require all tasks in gulp/tasks, including subfolders
requireDir('./gulp/tasks', { recurse: true });
=======
/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const wrench = require('wrench');
const runSequence = require('run-sequence');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
wrench.readdirSyncRecursive('./gulp').filter(function(file) {
  return (/\.(js|coffee)$/i).test(file);
}).map(function(file) {
  require('./gulp/' + file);
});

// Ensure that linting occurs before build runs. This prevents
// the build from breaking due to poorly formatted code.
gulp.task('build-in-sequence', function(done) {
  runSequence(['lint-src', 'lint-test'], 'build', done);
});

const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc', '.jscsrc'];

// Run the headless unit tests as you make changes.
gulp.task('watch', function() {
  gulp.watch(watchFiles, ['test']);
});

// An alias of test
gulp.task('default', ['test']);
>>>>>>> Stashed changes

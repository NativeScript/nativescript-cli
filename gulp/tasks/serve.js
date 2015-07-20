const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const glob = require('glob');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const browserSync = require('browser-sync');
const config = require('../config');
const errorHandler = config.errorHandler('serve');
const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc', '.jscsrc'];

gulp.task('browser-sync', function() {
  browserSync(config.browserSync);
});

// Bundle our app for our unit tests
gulp.task('browserify', function() {
  const testFiles = glob.sync(config.files.test);
  const allFiles = ['./test/setup/browser.js'].concat(testFiles);
  return browserify(allFiles)
    .transform(babelify.configure(config.babel))
    .bundle()
    .on('error', errorHandler)
    .pipe($.plumber())
    .pipe(source('tests.js'))
    .pipe(gulp.dest(config.paths.tmp))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('test-browser', function() {
  return gulp.src('./test/runner.html')
    .pipe($.mochaPhantomjs());
});

gulp.task('serve', ['browserify', 'browser-sync'], function() {
  gulp.watch(watchFiles, ['browserify', 'test-browser']);
});

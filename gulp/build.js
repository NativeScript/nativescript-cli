const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const path = require('path');
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const config = require('./config');
const errorHandler = config.errorHandler('build');

// Build two versions of the library
gulp.task('build', ['lint-src', 'clean'], function() {
  return browserify(path.join(config.paths.src, config.files.entry.fileName + '.js'), config.browserify)
    .transform(babelify.configure(config.babel))
    .bundle()
    .on('error', errorHandler)
    .pipe($.plumber())
    .pipe(source(config.files.output.fileName + '.js'))
    .pipe(transform(function() { return exorcist(path.join(config.paths.dist, config.files.output.fileName + '.js.map')); }))
    .pipe(gulp.dest(config.paths.dist))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.uglify())
    .pipe($.rename(config.files.output.fileName + '.min.js'))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(config.paths.dist));
});

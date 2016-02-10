const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const path = require('path');
const browserify = require('browserify');
const config = require('../config');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('merge-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const errorHandler = config.errorHandler('build');

gulp.task('transpile', function() {
  const kinvey = gulp.src(path.join(config.paths.src, 'kinvey.js'))
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(path.join(config.paths.dist, 'src/')))
    .on('error', errorHandler);
  const core = gulp.src(path.join(config.paths.src, 'core/**/*.js'))
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(path.join(config.paths.dist, 'src/core')))
    .on('error', errorHandler);
  const shims = gulp.src(path.join(config.paths.src, `shims/${config.platform}/**/*.js`))
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(path.join(config.paths.dist, `src/shims/${config.platform}`)))
    .on('error', errorHandler);
  return merge(kinvey, core, shims);
});

gulp.task('build', ['transpile'], function () {
  if (config.platform !== 'node') {
    return browserify(config.browserify)
      .transform('envify', config.env)
      .bundle()
      .pipe($.plumber())
      .pipe(source(`${config.files.output.filename}.js`))
      .pipe(transform(function() {
        return exorcist(path.join(config.paths.dist, `dist/${config.files.output.filename}.js.map`));
      }))
      .pipe(gulp.dest(path.join(config.paths.dist, 'dist')))
      .pipe(buffer())
      .pipe($.uglify())
      .pipe($.rename(`${config.files.output.filename}.min.js`))
      .pipe(gulp.dest(path.join(config.paths.dist, 'dist')))
      .on('error', errorHandler);
  }
});

gulp.task('build-legacy', function () {
  return browserify(config.legacy.browserify)
    // .transform('envify', config.env)
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(gulp.dest(config.paths.legacy.dist))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe(gulp.dest(config.paths.legacy.dist))
    // .pipe($.gzip())
    // .pipe(gulp.dest(config.paths.legacy.dist))
    .on('error', errorHandler);
});

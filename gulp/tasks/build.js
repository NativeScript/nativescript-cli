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
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build', function () {
  if (config.platform === 'node') {
    const firstPath = gulp.src(path.join(config.paths.src, 'core/**/*.js'))
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(path.join(config.paths.dist, 'src/core')))
    .on('error', errorHandler);
    const secondPath = gulp.src(path.join(config.paths.src, 'kinvey.js'))
    .pipe($.plumber())
    .pipe($.babel())
    .pipe(gulp.dest(path.join(config.paths.dist, 'src/')))
    .on('error', errorHandler);
    return merge(firstPath, secondPath);
  }

  return browserify(config.browserify)
    // .transform(envify(config.env), { global: true })
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(gulp.dest(config.paths.dist))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe(gulp.dest(config.paths.dist))
    // .pipe($.gzip())
    // .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
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

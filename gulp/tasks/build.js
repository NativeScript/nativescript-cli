const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const browserify = require('browserify');
const config = require('../config');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build', function () {
  return browserify(config.browserify)
    .transform('envify', config.env)
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(gulp.dest(config.paths.dist))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe(gulp.dest(config.paths.dist))
    .pipe($.gzip())
    .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
});

gulp.task('build-legacy', function () {
  return browserify(config.legacy.browserify)
    .transform('envify', config.env)
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(gulp.dest(config.paths.legacy.dist))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe(gulp.dest(config.paths.legacy.dist))
    .pipe($.gzip())
    .pipe(gulp.dest(config.paths.legacy.dist))
    .on('error', errorHandler);
});

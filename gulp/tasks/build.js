const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const browserify = require('browserify');
const config = require('../config');
const path = require('path');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build', ['clean'], function() {
  return browserify(config.browserify)
    .transform('envify', config.env)
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(transform(function() {
      return exorcist(path.join(config.paths.dist, `${config.files.output.filename}.js.map`));
    }))
    .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
});

gulp.task('build-legacy', ['clean-legacy'], function() {
  return browserify(config.legacy.browserify)
    .transform('envify', config.env)
    .transform('babelify', config.babelify)
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(transform(function() {
      return exorcist(path.join(config.paths.legacy.dist, `${config.files.output.filename}.js.map`));
    }))
    .pipe(gulp.dest(config.paths.legacy.dist))
    .on('error', errorHandler);
});

// Build minified version of the library
gulp.task('build-release', ['build'], function() {
  return gulp.src(path.join(config.paths.dist, `${config.files.output.filename}.js`))
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe($.sourcemaps.write('./', {
      sourceMappingURL: function(file) {
        return `${file.relative}.map`;
      }
    }))
    .pipe(gulp.dest(config.paths.dist))
    .pipe($.gzip())
    .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
});

gulp.task('build-legacy-release', ['build-legacy'], function() {
  return gulp.src(path.join(config.paths.legacy.dist, `${config.files.output.filename}.js`))
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe($.sourcemaps.write('./', {
      sourceMappingURL: function(file) {
        return `${file.relative}.map`;
      }
    }))
    .pipe(gulp.dest(config.paths.legacy.dist))
    .pipe($.gzip())
    .pipe(gulp.dest(config.paths.legacy.dist))
    .on('error', errorHandler);
});

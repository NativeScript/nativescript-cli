const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const browserify = require('browserify');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const config = require('../config');
const clone = require('lodash/lang/clone');
const path = require('path');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build-dev', function() {
  return browserify(path.join(config.paths.src, `${config.files.entry.filename}.js`), config.browserify)
    .transform('envify', config.env)
    .transform('babelify')
    .bundle()
    .on('error', errorHandler)
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe($.streamify($.wrapper({
      header: config.header,
      footer: config.footer
    })))
    .pipe(transform(function() { return exorcist(path.join(config.paths.dist, `${config.files.output.filename}.js.map`)); }))
    .pipe(gulp.dest(config.paths.dist));
});

gulp.task('build-dev-legacy', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe($.rename(`${webpackConfig.output.filename}.js`))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

// Build minified version of the library
gulp.task('build-release', function() {
  const webpackConfig = clone(config.webpack, true);
  // webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe($.rename(`${webpackConfig.output.filename}.min.js`))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

gulp.task('build-release-legacy', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  // webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe($.rename(`${webpackConfig.output.filename}..min.js`))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

gulp.task('build', ['clean', 'build-dev', 'build-release']);
gulp.task('build-legacy', ['clean', 'build-dev-legacy', 'build-release-legacy']);

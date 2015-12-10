const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const config = require('../config');
const clone = require('lodash/lang/clone');
const path = require('path');

// Build unminified version of the library
gulp.task('build-dev', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.output.filename = webpackConfig.output.filename + '.js';
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe($.wrapper({
      header: config.header,
      footer: config.footer
    }))
    .pipe($.rename(webpackConfig.output.filename))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

gulp.task('build-dev-legacy', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  webpackConfig.output.filename = webpackConfig.output.filename + '.js';
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe($.rename(webpackConfig.output.filename + '.js'))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

// Build minified version of the library
gulp.task('build-release', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.output.filename = webpackConfig.output.filename + '.min.js';
  // webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe($.rename(webpackConfig.output.filename))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

gulp.task('build-release-legacy', function() {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  webpackConfig.output.filename = webpackConfig.output.filename + '.min.js';
  // webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe($.rename(webpackConfig.output.filename))
    .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
});

gulp.task('build', ['clean', 'build-dev', 'build-release']);
gulp.task('build-legacy', ['clean', 'build-dev-legacy', 'build-release-legacy']);

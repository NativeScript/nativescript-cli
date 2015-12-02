const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const webpack = require('webpack');
const config = require('../config');
const clone = require('lodash/lang/clone');
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build-dev', function(done) {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.output.filename = webpackConfig.output.filename + '.js';
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      errorHandler(err);
      throw new $.util.PluginError('[build]', err);
    }

    done();
  });
});

gulp.task('build-dev-legacy', function(done) {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  webpackConfig.output.filename = webpackConfig.output.filename + '.js';
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      errorHandler(err);
      throw new $.util.PluginError('[build]', err);
    }

    done();
  });
});

// Build minified version of the library
gulp.task('build-release', function(done) {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.output.filename = webpackConfig.output.filename + '.min.js';
  webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      errorHandler(err);
      throw new $.util.PluginError('[build]', err);
    }

    done();
  });
});

gulp.task('build-release-legacy', function(done) {
  const webpackConfig = clone(config.webpack, true);
  webpackConfig.context = config.paths.legacy;
  webpackConfig.output.filename = webpackConfig.output.filename + '.min.js';
  webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      errorHandler(err);
      throw new $.util.PluginError('[build]', err);
    }

    done();
  });
});

gulp.task('build', ['clean', 'build-dev', 'build-release']);
gulp.task('build-legacy', ['clean', 'build-dev-legacy', 'build-release-legacy']);

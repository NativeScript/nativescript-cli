const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const path = require('path');
const webpack = require('webpack');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const config = require('../config');
const errorHandler = config.errorHandler('build');

// Build unminified and minified versions of the library
gulp.task('build', ['lint-src', 'clean'], function(done) {
  webpack(config.webpack, (err, stats) => {
    if (err) {
      throw new $.util.PluginError('[build]', err);
    }

    $.util.log('[build]', stats.toString({
      colors: true
    }));
    done();
  });
});

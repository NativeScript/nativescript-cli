'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var platform = $.util.env.platform || 'node';
var config = require('../' + platform + '.config');

gulp.task('clean', function(done) {
  del([config.distDirectory], done);
});

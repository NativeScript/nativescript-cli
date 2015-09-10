const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});

gulp.task('docs', $.shell.task([
  './node_modules/.bin/esdoc -c esdoc.json'
]));

const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const config = require('../config');
const path = require('path');
const s3 = require('gulp-s3-upload')({
  accessKeyId: process.env.S3_ACCESSKEYID,
  secretAccessKey: process.env.S3_SECRETACCESSKEY,
  maxRetries: 5
});
const errorHandler = config.errorHandler('release');

gulp.task('clone', ['clean'], function (done) {
  $.git.clone(config.git, { args: config.paths.dist }, function (err) {
    if (err) {
      errorHandler(err);
    }

    done(err);
  });
});

gulp.task('bump', function () {
  return gulp.src([
    path.join(config.paths.dist, 'bower.json'),
    path.join(config.paths.dist, 'package.json')
  ])
    .pipe($.bump({ version: config.version }))
    .pipe(gulp.dest(config.paths.dist));
});

gulp.task('commit', function () {
  process.chdir(config.paths.dist);
  return gulp.src('./*')
    .pipe($.git.add())
    .pipe($.git.commit(`Updating to version ${config.version}.`));
});

gulp.task('tag', function (done) {
  process.chdir(config.paths.dist);
  $.git.tag(config.version, `Version ${config.version}`, function (err) {
    if (err) {
      errorHandler(err);
    }

    done(err);
  });
});

gulp.task('push', function (done) {
  process.chdir(config.paths.dist);
  $.git.push('origin', 'master', {
    args: '--follow-tags -f'
  }, function (err) {
    if (err) {
      errorHandler(err);
    }

    done(err);
  });
});

gulp.task('uploadS3', function () {
  gulp.src([
    path.join(config.paths.dist, 'dist', `${config.files.output.filename}.js`),
    path.join(config.paths.dist, 'dist', `${config.files.output.filename}.js.map`),
    path.join(config.paths.dist, 'dist', `${config.files.output.filename}.min.js`)
  ])
    .pipe($.plumber())
    .pipe($.if(`${config.files.output.filename}.js`,
                $.rename({ basename: `${config.files.output.filename}-${config.version}` })))
    .pipe($.if(`${config.files.output.filename}.map.js`,
                $.rename({ basename: `${config.files.output.filename}-${config.version}.map` })))
    .pipe($.if(`${config.files.output.filename}.min.js`,
                $.rename({ basename: `${config.files.output.filename}-${config.version}.min.js` })))
    .pipe(s3(config.s3));
});

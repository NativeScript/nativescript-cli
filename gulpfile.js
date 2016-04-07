 /* eslint-disable */
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var util = require('gulp-util');
var git = require('gulp-git');
var prompt = require('gulp-prompt');
var bump = require('gulp-bump');
var babel = require('gulp-babel');
var del = require('del');
var runSequence = require('run-sequence');
var semverRegex = require('semver-regex');

function errorHandler(err) {
  util.log(err.toString());
  this.emit('end');
}

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean', function(done) {
  return del(['build'], done);
});

gulp.task('build', ['clean', 'lint'], function() {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build'))
});

gulp.task('commit', function() {
  return gulp.src('./')
    .pipe(prompt.prompt({
      type: 'input',
      name: 'message',
      message: 'What would you like to say for the commit message?',
      validate: function(message) {
        if (message && message.trim() !== '') {
          return true;
        }

        return false;
      }
    }, function(res) {
      gulp.src('./*')
        .pipe(git.add())
        .pipe(git.commit(res.message));
    }));
});

gulp.task('bump', function() {
  var packageJSON = require('./package.json');
  var version = packageJSON.version;

  return gulp.src('./')
    .pipe(prompt.prompt({
      type: 'input',
      name: 'version',
      message: `The current version is ${version}. What is the new version?`,
      validate: function(version) {
        return semverRegex().test(version);
      }
    }, function(res) {
      gulp.src(['bower.json', 'package.json'])
        .pipe(bump({ version: res.version }))
        .pipe(gulp.dest('./'));
    }));
});

gulp.task('tag', ['bump'], function(done) {
  var packageJSON = require('./package.json');
  var version = packageJSON.version;

  git.tag(version, null, function (err) {
    if (err) {
      errorHandler(err);
    }

    done(err);
  });
});

gulp.task('push', function(done) {
  git.push('origin', 'master', { args: '--follow-tags -f' }, function(error) {
    if (error) {
      errorHandler(error);
    }

    done(error);
  });
});

gulp.task('default', function() {
  runSequence('build');
});

import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import del from 'del';
import runSequence from 'run-sequence';

gulp.task('lint', () => {
  const stream = gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
  return stream;
});

gulp.task('clean', done => del(['build'], done));

gulp.task('build', ['clean', 'lint'], () => {
  const stream = gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./build'));
  return stream;
});

gulp.task('default', () => {
  runSequence('build');
});

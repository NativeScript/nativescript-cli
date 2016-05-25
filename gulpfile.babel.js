import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import del from 'del';
import env from 'gulp-env';
import bump from 'gulp-bump';
import file from 'gulp-file';
import util from 'gulp-util';
import { argv as args } from 'yargs';

function errorHandler(err) {
  util.log(err.toString());
  this.emit('end');
}

gulp.task('lint', () => {
  const stream = gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
  return stream;
});

gulp.task('clean', done => del(['es5', 'tmp'], done));

gulp.task('build', ['clean', 'lint'], () => {
  const envs = env.set({
    KINVEY_ACL_ATTRIBUTE: '_acl',
    KINVEY_DATASTORE_NAMESPACE: 'appdata',
    KINVEY_EMAIL_ATTRIBUTE: 'email',
    KINVEY_FILES_NAMESPACE: 'blob',
    KINVEY_ID_ATTRIBUTE: '_id',
    KINVEY_KMD_ATTRIBUTE: '_kmd',
    KINVEY_MIC_AUTH_PATHNAME: '/oauth/auth',
    KINVEY_MIC_TOKEN_PATHNAME: '/oauth/token',
    KINVEY_PUSH_COLLECTION_NAME: 'kinvey_push',
    KINVEY_RPC_NAMESPACE: 'rpc',
    KINVEY_SOCIAL_IDENTITY_ATTRIBUTE: '_socialIdentity',
    KINVEY_SOCIAL_IDENTITY_COLLECTION_NAME: 'kinvey_socialIdentity',
    KINVEY_SYNC_COLLECTION_NAME: 'kinvey_sync',
    KINVEY_SYNC_KEY_COLLECTION_NAME: 'kinvey_syncKey',
    KINVEY_USER_COLLECTION_NAME: 'kinvey_user',
    KINVEY_USERNAME_ATTRIBUTE: 'username',
    KINVEY_USERS_NAMESPACE: 'user',
  });

  const stream = gulp.src('src/**/*.js')
    .pipe(envs)
    .pipe(babel())
    .pipe(envs.reset)
    .pipe(gulp.dest('./es5'))
    .on('error', errorHandler);
  return stream;
});

gulp.task('bumpVersion', () => {
  if (!args.type && !args.version) {
    args.type = 'patch';
  }

  const stream = gulp.src('./package.json')
    .pipe(bump({
      preid: 'beta',
      type: args.type,
      version: args.version
    }))
    .pipe(gulp.dest(`${__dirname}/`))
    .on('error', errorHandler);
  return stream;
});

gulp.task('bump', ['bumpVersion'], () => {
  const stream = file('bump.txt', '', { src: true })
    .pipe(gulp.dest(`${__dirname}/tmp`))
    .on('error', errorHandler);
  return stream;
});

gulp.task('default', ['build']);

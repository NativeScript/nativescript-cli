const gulp = require('gulp');
const path = require('path');
const Server = require('karma').Server;

// Run test once and exit
gulp.task('unit', function(done) {
  new Server({
    configFile: path.join(__dirname, '..', '..', 'test', 'karma.conf.js')
  }, done).start();
});

gulp.task('e2e', function(done) {
  new Server({
    singleRun: true,
    configFile: path.join(__dirname, '..', '..', 'test', 'karma.conf-ci.js')
  }, done).start();
});

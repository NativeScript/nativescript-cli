const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true
});
const browserify = require('browserify');
const config = require('../config');
const path = require('path');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const exorcist = require('exorcist');
const errorHandler = config.errorHandler('build');

// Build unminified version of the library
gulp.task('build', ['clean', 'lint-src'], function() {
  return browserify(config.browserify)
    .transform('envify', config.env)
    .transform('babelify')
    .bundle()
    .pipe($.plumber())
    .pipe(source(`${config.files.output.filename}.js`))
    .pipe(transform(function() {
      return exorcist(path.join(config.paths.dist, `${config.files.output.filename}.js.map`));
    }))
    .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
});

// gulp.task('build-dev-legacy', function() {
//   const webpackConfig = clone(config.webpack, true);
//   webpackConfig.context = config.paths.legacy;
//   return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
//     .pipe(webpackStream(webpackConfig, webpack))
//     .pipe($.rename(`${webpackConfig.output.filename}.js`))
//     .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
// });

// Build minified version of the library
gulp.task('build-release', ['build'], function() {
  return gulp.src(path.join(config.paths.dist, `${config.files.output.filename}.js`))
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.rename(`${config.files.output.filename}.min.js`))
    .pipe($.sourcemaps.write('./', {
      sourceMappingURL: function(file) {
        return `${file.relative}.map`;
      }
    }))
    .pipe(gulp.dest(config.paths.dist))
    .pipe($.gzip())
    .pipe(gulp.dest(config.paths.dist))
    .on('error', errorHandler);
});

// gulp.task('build-release-legacy', function() {
//   const webpackConfig = clone(config.webpack, true);
//   webpackConfig.context = config.paths.legacy;
//   // webpackConfig.plugins = [new webpack.optimize.UglifyJsPlugin({ minimize: true })];
//   return gulp.src(path.resolve(webpackConfig.context, webpackConfig.entry))
//     .pipe(webpackStream(webpackConfig, webpack))
//     .pipe($.rename(`${webpackConfig.output.filename}..min.js`))
//     .pipe(gulp.dest(path.resolve(webpackConfig.output.path)));
// });

gulp.task('build-legacy', ['clean', 'build-dev-legacy', 'build-release-legacy']);

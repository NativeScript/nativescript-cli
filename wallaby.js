/* eslint-disable */
require('babel-register')({
  ignore: /\/node_modules\/(?!wallabify\/)/
});
var wallabify = require('wallabify');

module.exports = function(wallaby) {
  var compiler = wallaby.compilers.babel({
    babelrc: true,
    sourceMaps: 'inline'
  });
  var postprocessor = wallabify({
    debug: true,
    entryPatterns: [
      'src/**/*.spec.js'
    ]
  });

  return {
    debug: true,
    files: [
      { pattern: 'node_modules/babel-polyfill/dist/polyfill.js', instrument: false },
      { pattern: 'package.json', load: false },
      { pattern: 'src/**/*.js', load: false },
      { pattern: 'test/helpers.js', load: false },
      { pattern: 'src/**/*.spec.js', ignore: true }
    ],
    tests: [
      { pattern: 'src/**/*.spec.js', load: false }
    ],
    testFramework: 'mocha',
    compilers: {
      '**/*.js': compiler
    },
    postprocessor: postprocessor,
    env: {
      runner: require('phantomjs2-ext').path,
      params: { runner: '--web-security=false' }
    },
    setup: function() {
      window.__moduleBundler.loadTests();
    }
  };
};

const babel = require('babel-core');

module.exports = function(wallaby) {
  return {
    files: [
      'config/*.json',
      'package.json',
      'src/**/*.js',
      'test/setup.js',
      'test/helpers.js'
    ],
    tests: [
      'test/specs/**/*.js'
    ],
    testFramework: 'mocha',
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: babel,
        comments: false,
        presets: ['es2015', 'stage-0'],
        ignore: /\/node_modules\/(?!qs\/)/ // Ignore all node_modules except qs
      })
    },
    env: {
      type: 'node',
      runner: 'node'
    },
    debug: true
  };
};

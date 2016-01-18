const babel = require('babel-core');

module.exports = function (wallaby) {
  return {
    files: [
      { pattern: 'node_modules/babel/node_modules/babel-core/browser-polyfill.js', instrument: false },
      { pattern: 'node_modules/babel-core/browser-polyfill.js', instrument: false },
      'src/*.js'
    ],

    tests: [
      'test/specs/*.js'
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
    // env: {
    //   type: 'node',
    //   runner: 'node'
    // },
    debug: false
  };
};

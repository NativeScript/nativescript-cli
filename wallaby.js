module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.js'
    ],

    tests: [
      'src/**/*.spec.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel()
    }
  };
};


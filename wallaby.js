/* eslint-disable */

module.exports = function(wallaby) {
  return {
    debug: true,
    files: [
      { pattern: 'package.json', load: false },
      { pattern: 'src/**/*.js', load: false },
      { pattern: 'test/helpers.js', load: false }
    ],
    tests: [
      { pattern: 'test/specs/**/*.js', load: false }
    ],
    testFramework: 'mocha',
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babelrc: true,
        sourceMaps: 'inline',
      })
    },
    env: {
      runner: require('phantomjs2-ext').path,
      params: { runner: '--web-security=false' }
    }
    // setup: function(wallaby) {
    //   var path = require('path');
    //   var fs = require('fs');
    //   var packagePath = path.join(wallaby.localProjectDir, 'package.json');
    //   var packageConfig = JSON.parse(fs.readFileSync(packagePath));
    //   var packageName = packageConfig.name;
    //   var modulePrototype = require('module').Module.prototype;

    //   if (!modulePrototype._originalRequire) {
    //     modulePrototype._originalRequire = modulePrototype.require;
    //     modulePrototype.require = function(filePath) {
    //       if (filePath.indexOf(packageName) !== -1) {
    //         return modulePrototype._originalRequire.call(this, path.join(wallaby.projectCacheDir, 'src', filePath.replace(packageName, '')));
    //       } else if (filePath.indexOf('test') !== -1) {
    //         return modulePrototype._originalRequire.call(this, path.join(wallaby.projectCacheDir, 'test', filePath.replace('test', '')));
    //       }

    //       return modulePrototype._originalRequire.call(this, filePath);
    //     };
    //   }
    // }
  };
};

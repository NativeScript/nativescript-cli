const path = require('path');
const glob = require('glob');

const appName = 'TestApp';
const rootPath = path.join(__dirname);
const appPath = path.join(rootPath, appName);
const appTestsPath = path.join(appPath, '/app/tests');
const tmpPath = path.join(rootPath, 'tmp');

module.exports = {
  mode: 'development',
  entry: function () {
    return glob.sync(path.resolve(tmpPath, '**/*.spec.js')).reduce((entries, testFile) => {
      const basename = path.basename(testFile);
      entries[basename] = testFile;
      return entries;
    }, {})
  },
  output: {
    path: appTestsPath,
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  externals: [
    'kinvey-nativescript-sdk'
  ],
  target: 'node'
}

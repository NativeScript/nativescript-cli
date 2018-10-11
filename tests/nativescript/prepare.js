/* eslint-disable */
// const npmRun = require('npm-run');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const babel = require('@babel/core');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const glob = require('glob');

const SDK = 'kinvey-nativescript-sdk';
const SHARED_TESTS_PATH = path.resolve(__dirname, '..', 'specs');
const SDK_TMP_TESTS_PATH = path.resolve(__dirname, 'tmp');
const SDK_TESTS_PATH = path.resolve(__dirname, 'app', 'tests');
const DOT_ENV_FILE = path.resolve(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(DOT_ENV_FILE)) {
  throw new Error(
    '.env file is missing. ' +
    'Please create a .env file that contains the appKey, appSecret, and masterSecret for the application you would like to use for running the integration tests.'
  );
}

// Cleanup
fs.removeSync(SDK_TMP_TESTS_PATH);
fs.removeSync(SDK_TESTS_PATH);

// Setup
fs.ensureDirSync(SDK_TMP_TESTS_PATH);

// Get all the tests
const tests = klawSync(SHARED_TESTS_PATH);

// Process the tests
tests.map((test) => {
  const newFilePath = path.resolve(SDK_TMP_TESTS_PATH, path.basename(test.path));

  if (path.extname(test.path) === '.js') {
    // Read the file
    const content = fs.readFileSync(test.path, 'utf8');

    // Replace __SDK__
    const newContent = content.replace(/__SDK__/i, SDK);

    // Transform with babel
    const babelContent = babel.transform(newContent);

    // Write the file
    fs.writeFileSync(newFilePath, babelContent.code);
  } else {
    // Copy the file
    fs.copySync(test.path, newFilePath);
  }
});

// Gather entry files
const files = glob.sync(`${SDK_TMP_TESTS_PATH}/**/*.spec.js`);
const entry = files.reduce((entry, file) => {
  const name = path.basename(file, '.spec.js');
  entry[name] = file;
  return entry;
}, {});

// Webpack
webpack({
  mode: 'development',
  plugins: [
    new Dotenv({
      path: DOT_ENV_FILE
    })
  ],
  externals: {
    'tns-core-modules/http': 'tns-core-modules/http'
  },
  entry,
  output: {
    filename: '[name].spec.js',
    path: SDK_TESTS_PATH,
    libraryTarget: 'commonjs2'
  }
}, (err, stats) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(stats.toString({
    chunks: false,  // Makes the build much quieter
    colors: true    // Shows colors in the console
  }));
});

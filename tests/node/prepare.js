/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const babel = require('@babel/core');

const SDK = 'kinvey-node-sdk';
const SHARED_TESTS_PATH = path.resolve(__dirname, '..', 'specs');
const SDK_TESTS_PATH = path.resolve(__dirname, 'tests');
const DOT_ENV_FILE = path.resolve(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(DOT_ENV_FILE)) {
  throw new Error(
    '.env file is missing. ' +
    'Please create a .env file that contains the appKey, appSecret, and masterSecret for the application you would like to use for running the integration tests.'
  );
}

// Cleanup
fs.removeSync(SDK_TESTS_PATH);

// Setup
fs.ensureDirSync(SDK_TESTS_PATH);

// Get all the tests
const tests = klawSync(SHARED_TESTS_PATH);

// Process the tests
tests.map((test) => {
  const newFilePath = path.resolve(SDK_TESTS_PATH, path.basename(test.path));

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

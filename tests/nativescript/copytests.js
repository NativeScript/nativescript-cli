/* eslint-disable */
// const npmRun = require('npm-run');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');

const SDK = 'kinvey-nativescript-sdk';
const SHARED_TESTS_PATH = path.resolve(__dirname, '..', 'specs');
const SDK_TESTS_PATH = path.resolve(__dirname, 'app', 'tests2');

// Build SDK
// npmRun.execSync('lerna run build --parallel -- --source-maps inline');

// Remove existing tests
fs.removeSync(SDK_TESTS_PATH);

// Get all the tests
const files = klawSync(SHARED_TESTS_PATH);

// Replace __SDK__ with the node sdk and write the file
files.map((file) => {
  if (path.extname(file.path) === '.js') {
    const data = fs.readFileSync(file.path, 'utf8');
    const newData = data.replace(/__SDK__/i, SDK);
    fs.ensureDirSync(SDK_TESTS_PATH);
    fs.writeFileSync(path.resolve(SDK_TESTS_PATH, path.basename(file.path)), newData);
  } else {
    fs.copySync(file.path, path.resolve(SDK_TESTS_PATH, path.basename(file.path)));
  }
});

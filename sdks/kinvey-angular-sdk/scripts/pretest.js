/* eslint-disable */
const npmRun = require('npm-run');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const pkg = require('../package.json');

const SHARED_TESTS_PATH = path.join(__dirname, '..', '..', '..', 'tests');
const SDK_PATH = path.join(__dirname, '..', pkg.main);
const SDK_TESTS_PATH = path.join(__dirname, '..', 'tests');

// Build SDK
npmRun.execSync('lerna run --scope kinvey-js-sdk --scope kinvey-angular-sdk build --parallel -- --source-maps inline');

// Remove existing tests
fs.removeSync(SDK_TESTS_PATH);

// Get all the tests
const files = klawSync(SHARED_TESTS_PATH);

// Replace __SDK__ with the node sdk and write the file
files.map((file) => {
  const data = fs.readFileSync(file.path, 'utf8');
  const newData = data.replace(/__SDK__/i, SDK_PATH);
  fs.ensureDirSync(SDK_TESTS_PATH);
  fs.writeFileSync(path.join(SDK_TESTS_PATH, path.basename(file.path)), newData);
});

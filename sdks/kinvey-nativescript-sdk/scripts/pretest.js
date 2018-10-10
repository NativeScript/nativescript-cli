/* eslint-disable */
const npmRun = require('npm-run');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const pkg = require('../package.json');

const APP_NAME = 'TestApp';
const APP_PATH = path.join(__dirname, '..', APP_NAME);
const CWD = process.cwd();
const SHARED_TESTS_PATH = path.join(__dirname, '..', '..', '..', 'tests');
const SDK_PATH = path.join(__dirname, '..', pkg.main);
const SDK_TESTS_PATH = path.join(__dirname, '..', APP_NAME, 'app', 'tests')

// Build SDK
npmRun.execSync('lerna run --scope kinvey-js-sdk --scope kinvey-nativescript-sdk build --parallel');

// Remove the old test app
fs.removeSync(APP_PATH);

// Create NativeScript test app
npmRun.execSync(`tns create ${APP_NAME}`);

// Init tests in test app
process.chdir(APP_PATH);
npmRun.execSync('tns test init --framework mocha');
process.chdir(CWD);

// Remove exisiting tests
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

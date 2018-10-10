/* eslint-disable */
// const npmRun = require('npm-run');
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');
const babel = require('babel-core');

const SDK = 'kinvey-nativescript-sdk';
const SHARED_TESTS_PATH = path.resolve(__dirname, '..', 'specs');
const SDK_TESTS_PATH = path.resolve(__dirname, 'app', 'tests');
const DOT_ENV_FILE = path.resolve(__dirname, '.env');

if (!fs.existsSync(DOT_ENV_FILE)) {
  throw new Error(
    '.env file is missing. ' +
    'Please create a .env file that contains the appKey, appSecret, and masterSecret for the application you would like to use for running the integration tests.'
  );
}

// Build SDK
// npmRun.execSync('lerna run build --parallel -- --source-maps inline');

// Remove existing tests
fs.removeSync(SDK_TESTS_PATH);

// Get all the tests
const files = klawSync(SHARED_TESTS_PATH);

// Replace __SDK__ with the node sdk and write the file
files.map((file) => {
  if (path.extname(file.path) === '.js') {
    const content = fs.readFileSync(file.path, 'utf8');
    const newContent = content.replace(/__SDK__/i, SDK);
    const result = babel.transform(newContent, {
      plugins: [
        'transform-runtime',
        ['inline-dotenv', {
          path: DOT_ENV_FILE
        }]
      ],
      presets: [
        ['env', {
          targets: {
            node: true
          }
        }]
      ]
    });
    fs.ensureDirSync(SDK_TESTS_PATH);
    fs.writeFileSync(path.resolve(SDK_TESTS_PATH, path.basename(file.path)), result.code);
  } else {
    fs.copySync(file.path, path.resolve(SDK_TESTS_PATH, path.basename(file.path)));
  }
});

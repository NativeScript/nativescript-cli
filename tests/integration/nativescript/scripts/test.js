const chalk = require('chalk');
const ora = require('ora');
const isArray = require('lodash/isArray');
const path = require('path');
const spawn = require('cross-spawn');
const del = require('del');
const fs = require('fs-extra');
const glob = require('glob');
const webpack = require('webpack');
const babel = require('@babel/core');
const pkg = require('../package.json');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const appName = 'TestApp';
const rootPath = path.join(__dirname, '..');
const appPath = path.join(rootPath, appName);
const sharedTestsPath = path.join(rootPath, '../specs');
const appTestsPath = path.join(appPath, '/app/tests');
const tmpPath = path.join(rootPath, 'tmp');

function runCommand(command, args, cwd = process.cwd(), silent = true) {
  const proc = spawn.sync(command, args, { cwd });

  if (proc.error) {
    console.log(JSON.stringify(proc.error));
  }

  if (!silent) {
    console.log(proc.stdout.toString());
    console.error(proc.stderr.toString());
  }
}

function build(file) {
  let singular = false;
  let files = file;

  if (!isArray(file)) {
    singular = true;
    files = [file];
  }

  const results = files.map((file) => {
    return babel.transformFileSync(file);
  });

  return singular ? results[0] : results;
}

const spinner = ora('Removing an exisiting NativeScript Test App...').start();

// Remove the existing app
del.sync([appPath]);

// Create a NativeScript app
spinner.text = 'Creating a NativeScript app...';
runCommand('tns', ['create', appName], rootPath);

// Setup the app for testing
spinner.text = 'Setting up the NativeScript app for testing...';
runCommand('tns', ['test', 'init', '--framework', 'mocha'], appPath);

// Copy karma.conf.js
fs.copyFileSync(path.join(rootPath, 'karma.conf.js'), path.join(appPath, 'karma.conf.js'));

// Copy mocha.opts
fs.copyFileSync(path.join(rootPath, 'mocha.opts'), path.join(appPath, 'mocha.opts'));

// Remove the existing app tests
del.sync([appTestsPath]);

// Pack and copy the kinvey-js-sdk
spinner.text = 'Packing and copying SDK to the NativeScript app...';
const jsSdkPath = path.join(__dirname, '../../../../packages/js-sdk');
runCommand('npm', ['pack'], jsSdkPath);
const jsSdkFile = glob
  .sync(path.join(jsSdkPath, '*.tgz'))
  .filter((file) => file.indexOf('kinvey-js-sdk') !== -1)
  .shift();
fs.copyFileSync(jsSdkFile, path.join(appPath, 'kinvey-js-sdk.tgz'));

// Pack and copy the kinvey-nativescript-sdk
const nativescriptSdkPath = path.join(__dirname, '../../../../packages/nativescript-sdk');
runCommand('npm', ['pack'], nativescriptSdkPath);
const nativescriptSdkFile = glob
  .sync(path.join(nativescriptSdkPath, '*.tgz'))
  .filter((file) => file.indexOf('kinvey-nativescript-sdk') !== -1)
  .shift();
fs.copyFileSync(nativescriptSdkFile, path.join(appPath, 'kinvey-nativescript-sdk.tgz'));

// Update the app package.json
const appPackageJson = require(path.join(appPath, 'package.json'));
const newDependencies = Object.assign({}, appPackageJson.dependencies, pkg.dependencies, { 'kinvey-js-sdk': 'file:kinvey-js-sdk.tgz', 'kinvey-nativescript-sdk': 'file:kinvey-nativescript-sdk.tgz' });
const newAppPackageJson = Object.assign({}, appPackageJson, { dependencies: newDependencies });
fs.outputFileSync(path.join(appPath, 'package.json'), JSON.stringify(newAppPackageJson, null, 4));

// Build shared tests and copy them to the app
spinner.text = 'Bundling test files and copying them to the the NativeScript app...';
const testFiles = []
  .concat(glob.sync(path.join(sharedTestsPath, '*.js')))
  .concat(glob.sync(path.join(sharedTestsPath, 'common/**/*.js')))
  .concat(glob.sync(path.join(sharedTestsPath, 'nativescript/**/*.js')));
build(testFiles)
  .map((result) => {
    return Object.assign({}, result, {
      code: result.code.replace('__SDK__', 'kinvey-nativescript-sdk')
    });
  })
  .forEach((result) => {
    const filePath = path.join(tmpPath, result.options.filename.replace(sharedTestsPath, ''));
    return fs.outputFileSync(filePath, result.code);
  });

// Bundle test files
webpack({
  mode: 'development',
  entry: glob.sync(path.resolve(tmpPath, '**/*.spec.js')).reduce((entries, testFile) => {
    const basename = path.basename(testFile);
    entries[basename] = testFile;
    return entries;
  }, {}),
  output: {
    path: appTestsPath,
    filename: '[name].js',
    libraryTarget: 'umd'
  },
  externals: [
    'events',
    'js-base64',
    'kinvey-js-sdk',
    'kinvey-nativescript-sdk',
    /^lodash/,
    'loglevel',
    'loglevel-plugin-prefix',
    'nativescript-secure-storage',
    'nativescript-sqlite',
    'nativescript-urlhandler',
    'p-queue',
    'pubnub',
    'rxjs',
    'sift',
    /^tns-core-modules/,
    'tslib',
    'url',
    'url-join'
  ],
  target: 'node'
}, (err, stats) => {
  if (err) {
    console.log(chalk.red(err.stack || err));
    if (err.details) {
      console.error(chalk.red(err.details));
    }

    spinner.fail('Unable to test NativeScript.');
    return;
  }

  // Remove the tmp directory
  del.sync([tmpPath]);

  spinner.succeed(`Done! cd ${appName} and run tns test ios.`);
});

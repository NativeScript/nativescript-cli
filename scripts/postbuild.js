/* eslint-disable */

const fs = require('fs-extra');
const path = require('path');
const replace = require('replace-in-file');
const SDKS = [
  'angular',
  'angular2',
  'html5',
  'node',
  'phonegap'
];

SDKS.forEach(function(sdk) {
  try {
    // Copy core directory to shim directories
    fs.copySync(path.join(__dirname, '../dist/core'), path.join(__dirname, '../dist', sdk, 'core'));

    // Replace require paths for core directory to be relative to the shim
    replace.sync({
      files: path.join(__dirname, '../dist', sdk, '**/*.js'),
      from: /..\/core/g,
      to: 'core'
    });

    // The above replace statement will replace some require paths with require('core/example')
    // This fixes the path to be require('./core/example')
    replace.sync({
      files: path.join(__dirname, '../dist', sdk, '*.js'),
      from: /core/g,
      to: './core'
    });

    try {
      // Copy .d.ts files
      fs.copySync(path.join(__dirname, '../src', sdk, 'kinvey.d.ts'), path.join(__dirname, '../dist', sdk, 'kinvey.d.ts'));
    } catch (error) { }

    // Copy package.json files
    fs.copySync(path.join(__dirname, '../src', sdk, 'package.json'), path.join(__dirname, '../dist', sdk, 'package.json'));

    // Copy LICENSE files
    fs.copySync(path.join(__dirname, '../src', sdk, 'LICENSE'), path.join(__dirname, '../dist', sdk, 'LICENSE'));
  }
  catch (error) {
    console.error(error);
    process.exit(1);
  }
});

try {
  // Copy core package.json
  fs.copySync(path.join(__dirname, '../src/core/package.json'), path.join(__dirname, '../dist/core/package.json'));

  // Copy core LICENSE
  fs.copySync(path.join(__dirname, '../src/core/package.json'), path.join(__dirname, '../dist/core/package.json'));
} catch (error) {
  console.error(error);
  process.exit(1);
}

const fs = require('fs-extra');
const path = require('path');
const { buildJS, buildTS } = require('./test.build');
const { TESTS_DIR, ROOT_DIR } = require('./utils');
const tsConfig = require('../tsconfig.json');
const tsConfigNativeScript = require('../tsconfig.nativescript.json');

// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config({ path: path.resolve(ROOT_DIR, 'tests', '.env') });

async function build() {
  const testsDir = path.resolve(ROOT_DIR, 'tests', 'shared');
  const buildDir = path.resolve(TESTS_DIR, 'nativescript', 'app', 'tests');
  const sdk = 'kinvey-nativescript-sdk';

  // Remove the existing tests src directory
  await fs.remove(buildDir);

  // Create the tests src directory
  await fs.ensureDir(buildDir);

  // Build JS
  buildJS(testsDir, buildDir, sdk);

  // Build TS
  buildTS(testsDir, buildDir, sdk, Object.assign({}, tsConfig.compilerOptions, tsConfigNativeScript.compilerOptions));
}

build();

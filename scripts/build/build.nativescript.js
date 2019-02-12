const fs = require('fs-extra');
const path = require('path');
const { buildJS, buildTS } = require('./build');
const { PACKAGES_DIR, ROOT_DIR } = require('../utils');
const tsConfig = require('../../tsconfig.json');
const tsConfigNativeScript = require('../../tsconfig.nativescript.json');

async function build() {
  const srcDir = path.resolve(ROOT_DIR, 'src');
  const buildDir = path.resolve(PACKAGES_DIR, 'kinvey-nativescript-sdk', 'src');
  const extensions = ['.nativescript', '.angular'];

  // Remove the existing SDK src directory
  await fs.remove(buildDir);

  // Create the SDK src directory
  await fs.ensureDir(buildDir);

  // Build JS
  buildJS(srcDir, buildDir, extensions);

  // Build TS
  buildTS(srcDir, buildDir, extensions, Object.assign({}, tsConfig.compilerOptions, tsConfigNativeScript.compilerOptions));
}

build();

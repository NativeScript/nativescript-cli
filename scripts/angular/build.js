const fs = require('fs-extra');
const glob = require('glob-promise');
const babel = require('@babel/core');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', '..', 'src');
const SDK_SRC_DIR = path.resolve(__dirname, '..', '..', 'packages', 'kinvey-angular-sdk', 'src');
const EXTENSION = '.angular';

async function build() {
  // Remove the existing SDK src directory
  await fs.remove(SDK_SRC_DIR);

  // Create the SDK src directory
  await fs.ensureDir(SDK_SRC_DIR);

  // Gather all the src files
  const files = await glob(path.resolve(SRC_DIR, '**/*.js'));

  // Filter the files
  const filteredFiles = files.filter((file) => {
    // Filter any file that contains a .html5 extension
    // This matches the following:
    // *.html5.js
    if (file.indexOf(EXTENSION) > 0) {
      return true;
    }

    // The remaining files may contain multiple extensions for other platforms.
    // An example could be *.nativescript.js which do not belong in the html5 build.
    // We will filter any file that contains only the .js extension
    if ((file.match(/\./g) || []).length === 1 && file.indexOf('.js') > 0) {
      return true;
    }

    // Do not include the file in the build
    return false;
  });

  // Transform each file with babel
  filteredFiles.forEach((file) => {
    babel.transformFileAsync(file)
      .then(({ code }) => fs.outputFile(path.join(SDK_SRC_DIR, file.replace(SRC_DIR, '').replace(EXTENSION, '')), code));
  });
}

// Build
build();

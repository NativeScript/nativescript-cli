const fs = require('fs-extra');
const glob = require('glob-promise');
const babel = require('@babel/core');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', '..', 'src');
const BUILD_DIR = path.resolve(__dirname, '..', '..', 'packages', 'kinvey-nativescript-sdk', 'src');
const EXTENSION = '.nativescript';

async function build() {
  // Remove the existing build directory
  await fs.remove(BUILD_DIR);

  // Create the build directory
  await fs.ensureDir(BUILD_DIR);

  // Gather all the src files
  const files = await glob(path.resolve(SRC_DIR, '**/*.js'));

  // Filter the files
  const filteredFiles = files.filter((file) => {
    // Filter any file that contains a .nativescript extension
    // This matches the following:
    // *.nativescript.js
    // *.nativescript.ios.js
    // *.nativescript.android.js
    if (file.indexOf(EXTENSION) > 0) {
      return true;
    }

    // The remaining files may contain multiple extensions for other platforms.
    // An example could be *.web.js which do not belong in the nativescript build.
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
      .then(({ code }) => fs.outputFile(path.join(BUILD_DIR, file.replace(SRC_DIR, '').replace(EXTENSION, '')), code));
  });
}

// Build
build();

const fs = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const { PACKAGES_DIR, ROOT_DIR } = require('./utils');

const srcDir = path.resolve(ROOT_DIR, 'src');
const buildDir = path.resolve(PACKAGES_DIR, 'kinvey-angular-sdk2', 'projects', 'kinvey-angular-sdk', 'src', 'lib');

async function build() {
  // Remove the existing build directory
  await fs.remove(buildDir);

  // Create the build directory
  await fs.ensureDir(buildDir);

  // Copy TypeScript Files
  return glob(path.resolve(srcDir, '**/*.ts'))
    .then((files) => files.filter((file) => {
      const extensions = file.split('.').slice(1);
      return extensions.length === 1;
    }))
    .then((files) => Promise.all(files.map((file) => {
      const dest = path.join(buildDir, file.replace(srcDir, ''));
      return fs.ensureDir(path.dirname(dest)).then(() => fs.copyFile(file, dest));
    })))

    // Copy Angular TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.html5.ts')))
    .then((files) => Promise.all(files.map((file) => {
      const dest = path.join(buildDir, file.replace(srcDir, '').replace('.html5', ''));
      return fs.ensureDir(path.dirname(dest)).then(() => fs.copyFile(file, dest));
    })))

    // Copy NativeScript TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.angular.ts')))
    .then((files) => Promise.all(files.map((file) => {
      const dest = path.join(buildDir, file.replace(srcDir, '').replace('.angular', ''));
      return fs.ensureDir(path.dirname(dest)).then(() => fs.copyFile(file, dest));
    })));
}

build();

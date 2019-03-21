const fs = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const helpers = require('./helpers');

async function copyFiles(src, dest, allowedExtensions = ['ts']) {
  // Remove the existing build directory
  await fs.remove(dest);

  await glob(path.join(src, '**/*.ts'))
    .then((files) => files.filter((file) => {
      const extensions = file.split('.').slice(1);
      return extensions.reduce((allowed, extension) => {
        if (!allowed) {
          return allowed;
        }
        return allowedExtensions.indexOf(extension) !== -1;
      }, true);
    }))
    .then((files) => files.map((file) => helpers
      .copyFile(file, path.join(dest, file.replace(src, '')))
    ));

  // Copy NativeScript TypeScript Files
  await glob(path.join(src, '**/*.nativescript.ts'))
    .then((files) => files.map((file) => helpers
      .copyFile(file, path.join(dest, file.replace(src, '').replace('.nativescript', '')))
    ));

  // Copy NativeScript Android TypeScript Files
  await glob(path.join(src, '**/*.nativescript.android.ts'))
    .then((files) => files.map((file) => helpers
      .copyFile(file, path.join(dest, file.replace(src, '').replace('.nativescript', '')))
    ));

  // Copy NativeScript iOS TypeScript Files
  await glob(path.join(src, '**/*.nativescript.ios.ts'))
    .then((files) => files.map((file) => helpers
      .copyFile(file, path.join(dest, file.replace(src, '').replace('.nativescript', '')))
    ));
}

copyFiles(
  helpers.root('src/core'),
  helpers.root('packages/kinvey-nativescript-sdk3/src/core')
);

copyFiles(
  helpers.root('src/angular'),
  helpers.root('packages/kinvey-nativescript-sdk3/src/angular'),
  ['ts', 'service', 'module']
);

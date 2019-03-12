const fs = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const { buildJS, buildTS } = require('./build');
const { PACKAGES_DIR, ROOT_DIR } = require('./utils');
const tsConfig = require('../tsconfig.json');
const tsConfigNativeScript = require('../tsconfig.nativescript.json');

const srcDir = path.resolve(ROOT_DIR, 'src');
const buildDir = path.resolve(PACKAGES_DIR, 'kinvey-nativescript-sdk', 'src');
const tsCompilerOptions = Object.assign({}, tsConfig.compilerOptions, tsConfigNativeScript.compilerOptions);

async function build() {
  // Remove the existing SDK src directory
  await fs.remove(buildDir);

  // Create the SDK src directory
  await fs.ensureDir(buildDir);

  // Build JavaScript Files
  return glob(path.resolve(srcDir, '**/*.js'))
    .then((files) => files.filter((file) => {
      const extensions = file.split('.').slice(1);
      return extensions.length === 1;
    }))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '')), code)))))

    // Build Angular JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.angular.js')))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.angular', '')), code)))))

    // Build NativeScript JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.js')))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '')), code)))))

    // Build NativeScript Android JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.android.js'))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '')), code))))))

    // Build NativeScript iOS JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.ios.js'))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '')), code))))))

    // Build TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.ts')))
    .then((files) => files.filter((file) => {
      const extensions = file.split('.').slice(1);
      return extensions.length === 1;
    }))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.ts', '.js')), outputText)))))

    // Build Angular TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.angular.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.angular', '').replace('.ts', '.js')), outputText)))))

    // Build NativeScript TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '').replace('.ts', '.js')), outputText)))))

    // Build NativeScript Android TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.android.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '').replace('.ts', '.js')), outputText)))))

    // Build NativeScript iOS TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.nativescript.ios.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.nativescript', '').replace('.ts', '.js')), outputText)))));
}

build();

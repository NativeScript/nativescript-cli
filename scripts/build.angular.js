const fs = require('fs-extra');
const glob = require('glob-promise');
const path = require('path');
const { buildJS, buildTS } = require('./build');
const { PACKAGES_DIR, ROOT_DIR } = require('./utils');
const tsConfig = require('../tsconfig.json');
const tsConfigNativeScript = require('../tsconfig.json');

const srcDir = path.resolve(ROOT_DIR, 'src');
const buildDir = path.resolve(PACKAGES_DIR, 'kinvey-angular-sdk', 'src');
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

    // Build HTML5 JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.html5.js')))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.html5', '')), code)))))

    // Build Angular JavaScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.angular.js')))
    .then((files) => Promise.all(files.map((file) => buildJS(file).then(({ code }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.angular', '')), code)))))

    // Build TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.ts')))
    .then((files) => files.filter((file) => {
      const extensions = file.split('.').slice(1);
      return extensions.length === 1;
    }))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.ts', '.js')), outputText)))))

    // Build HTML5 TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.html5.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.html5', '').replace('.ts', '.js')), outputText)))))

    // Build Angular TypeScript Files
    .then(() => glob(path.resolve(srcDir, '**/*.angular.ts')))
    .then((files) => Promise.all(files.map((file) => buildTS(file, tsCompilerOptions).then(({ outputText }) => fs.outputFile(path.join(buildDir, file.replace(srcDir, '').replace('.angular', '').replace('.ts', '.js')), outputText)))));
}

build();

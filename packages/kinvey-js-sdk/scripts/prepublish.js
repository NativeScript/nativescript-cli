/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

async function createDist() {
  await fs.ensureDir(DIST)
}

async function copyReadme() {
  const filename = 'README.md';
  await fs.copy(path.join(ROOT, filename), path.join(DIST, filename));
}

async function copyLicense() {
  const filename = 'LICENSE';
  await fs.copy(path.join(ROOT, filename), path.join(DIST, filename));
}

async function copyPackageJson() {
  const filename = 'package.json';
  const pkg = await fs.readJson(path.join(ROOT, filename));
  delete pkg.private;
  delete pkg.scripts;
  delete pkg.devDependencies;
  await fs.writeJson(path.join(DIST, filename), pkg, { spaces: '\t' });
}

createDist();
copyReadme();
copyLicense();
copyPackageJson();

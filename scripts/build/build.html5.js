const fs = require('fs-extra');
const path = require('path');
const { buildJS } = require('./build');
const { PACKAGES_DIR, ROOT_DIR } = require('../utils');

async function build() {
  const srcDir = path.resolve(ROOT_DIR, 'src');
  const buildDir = path.resolve(PACKAGES_DIR, 'kinvey-html5-sdk', 'src');
  const extensions = ['.html5'];

  // Remove the existing SDK src directory
  await fs.remove(buildDir);

  // Create the SDK src directory
  await fs.ensureDir(buildDir);

  // Build JS
  buildJS(srcDir, buildDir, extensions);
}

build();

/* eslint-disable */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

try {
  // Copy travis.yml
  fs.copySync(path.join(__dirname, '../.travis.yml'), path.join(__dirname, '../dist/.travis.yml'));

  // Copy package.json
  const pkg = require('../package.json');
  delete pkg.private;
  delete pkg.dependencies;
  delete pkg.devDependencies;
  delete pkg.scripts;
  fs.writeFileSync(path.join(__dirname, '../dist/package.json'), JSON.stringify(pkg, null, 2));

  // Copy bower.json
  fs.copySync(path.join(__dirname, '../bower.json'), path.join(__dirname, '../dist/bower.json'));

  // Copy LICENSE
  fs.copySync(path.join(__dirname, '../LICENSE'), path.join(__dirname, '../dist/LICENSE'));

  // Copy README
  fs.copySync(path.join(__dirname, '../README.md'), path.join(__dirname, '../dist/README.md'));
}
catch (error) {
  console.error(error);
  process.exit(1);
}

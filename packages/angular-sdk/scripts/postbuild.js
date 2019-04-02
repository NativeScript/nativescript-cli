const fs = require('fs-extra');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const LIB_DIR = path.join(__dirname, '../lib');

// Ensure LIB_DIR exists
fs.ensureDirSync(LIB_DIR);

// Copy package.json
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, './package.json')).toString());
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.private;
fs.writeFileSync(path.join(LIB_DIR, './package.json'), JSON.stringify(pkg));

// Copy LICENSE
fs.copyFileSync(path.join(ROOT_DIR, './LICENSE'), path.join(LIB_DIR, './LICENSE'));

// Copy README.md
fs.copyFileSync(path.join(ROOT_DIR, './README.md'), path.join(LIB_DIR, './README.md'));

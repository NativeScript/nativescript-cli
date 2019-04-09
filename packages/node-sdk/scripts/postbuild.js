const fs = require('fs-extra');
const path = require('path');

const LIB_DIR = path.join(__dirname, '../lib');

// Cleanup build
fs.copySync(path.join(LIB_DIR, './src'), LIB_DIR);
fs.removeSync(path.join(LIB_DIR, './src'));
fs.removeSync(path.join(LIB_DIR, './package.json'))

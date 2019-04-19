const fs = require('fs-extra');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const libPath = path.join(rootPath, 'lib');
const tmpPath = path.join(rootPath, 'tmp');

// Copy /lib to /tmp
fs.copySync(libPath, tmpPath);

// Remove /lib
fs.removeSync(libPath);

// Copy /tmp/src to /lib
fs.copySync(path.join(tmpPath, 'src'), libPath);

// Remove /tmp
fs.removeSync(tmpPath);

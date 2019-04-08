const fs = require('fs-extra');
const path = require('path');

const LIB_DIR = path.join(__dirname, '../lib');

// Delete LIB_DIR
fs.remove(LIB_DIR);

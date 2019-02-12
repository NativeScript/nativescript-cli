const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(ROOT_DIR, 'packages');

module.exports = {
  ROOT_DIR,
  PACKAGES_DIR
};

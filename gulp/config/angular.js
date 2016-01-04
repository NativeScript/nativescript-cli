const path = require('path');
const config = {
  legacy: {}
};

config.browserify = {
  entries: path.join(__dirname, '..', '..', 'src', 'shims', 'angular', 'index.js')
};

config.legacy.browserify = {
  entries: path.join(__dirname, '..', '..', 'src', 'shims', 'angular', 'index.legacy.js')
};

// Export
module.exports = config;

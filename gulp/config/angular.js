const path = require('path');
const config = {};

config.browserify = {
  entries: path.join(__dirname, '..', '..', 'src', 'shims', 'angular', 'index.js')
};

// Export
module.exports = config;

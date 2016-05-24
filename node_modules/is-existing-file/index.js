'use strict';
var fs = require('fs');

module.exports = exports = function isExistingFile(filepath, cb) {
  fs.stat(filepath, function (err, stats) {
    if (err) {
      return cb(false);
    }
    return cb(stats.isFile());
  });
};

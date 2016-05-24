'use strict';
var writeFile = require('safe-write-file');

module.exports = function createFile(filename, contents, cb) {
  writeFile(filename, contents, {encoding: 'utf8', flag: 'wx'}, function (err) {
    if (!err || err.code === 'EEXIST') {
      return cb();
    }
    cb(err);
  });
};

const isArray = require('lodash/isArray');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');
const babel = require('@babel/core');

const SPECS_DIR = path.join(__dirname, '../../specs');
const SRC_DIR = path.join(__dirname, '../src');

function build(file) {
  let singular = false;
  let files = file;

  if (!isArray(file)) {
    singular = true;
    files = [file];
  }

  return Promise
    .all(files.map(function (file) {
      return babel.transformFileAsync(file);
    }))
    .then(function (results) {
      return singular ? results[0] : results;
    });
}

function copy(files) {
  return build(files)
    .then(function (results) {
      return Promise.all(results
        .map(function (result) {
          result.code = result.code.replace('__SDK__', 'kinvey-html5-sdk');
          return result;
        })
        .map(function (result) {
          const filePath = path.join(SRC_DIR, result.options.filename.replace(SPECS_DIR, ''));
          return fs.outputFile(filePath, result.code);
        }));
    });
}

fs.remove(SRC_DIR)
  .then(function() {
    return glob(path.join(SPECS_DIR, '*.js'))
      .then(function (files) {
        return copy(files);
      });
  })
  .then(function () {
    return glob(path.join(SPECS_DIR, 'common/**/*.js'))
      .then(function (files) {
        return copy(files);
      });
  })
  .then(function () {
    return glob(path.join(SPECS_DIR, 'html5/**/*.js'))
      .then(function (files) {
        return copy(files);
      });
  })
  .catch(function (error) {
    console.log(error);
  });

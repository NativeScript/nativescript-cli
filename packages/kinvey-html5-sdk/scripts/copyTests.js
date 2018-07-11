/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');
const klawSync = require('klaw-sync');

const SHARED_TESTS_DIR = path.join(__dirname, '..', '..', 'test');
const ROOT_DIR = path.join(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'test');

function removeTests() {
  fs.removeSync(TEST_DIR);
}

function copyTests() {
  const tests = klawSync(SHARED_TESTS_DIR);

  if (tests.length > 0) {
    fs.ensureDirSync(TEST_DIR);
    tests.forEach((test) => {
      const filename = path.basename(test.path);
      fs.copySync(test.path, path.join(TEST_DIR, filename));
    });
  }
}

removeTests();
copyTests();

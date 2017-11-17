const { join } = require('path');
const Proxyquire = require('proxyquire');

// TODO: is there a better way to adjust relative path
exports.mockRequiresIn = function mockRequiresIn(fromPath, relativePath, mocks, properyName) {
  const path = join(fromPath, relativePath);
  const res = Proxyquire(path, mocks);
  return properyName ? res[properyName] : res;
}

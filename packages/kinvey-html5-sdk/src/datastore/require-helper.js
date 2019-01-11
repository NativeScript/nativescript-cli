"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockRequiresIn = mockRequiresIn;

var _path = require("path");

var _proxyquire = _interopRequireDefault(require("proxyquire"));

/**
 * @private
 * TODO: is there a better way to adjust relative path
 */
function mockRequiresIn(fromPath, relativePath, mocks, properyName) {
  var path = (0, _path.join)(fromPath, relativePath);
  var res = (0, _proxyquire.default)(path, mocks);
  return properyName ? res[properyName] : res;
}
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findById;

var _download = _interopRequireDefault(require("./download"));

function findById(id, options) {
  return (0, _download.default)(id, options);
}
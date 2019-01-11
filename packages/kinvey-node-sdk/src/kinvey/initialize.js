"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initialize;

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

/**
 * @deprecated Please use init().
 */
function initialize() {
  return Promise.reject(new _kinvey.default('initialize() has been deprecated. Please use init().'));
}
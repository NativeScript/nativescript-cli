"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getId = getId;

var _utils = require("./utils");

// eslint-disable-next-line import/prefer-default-export
function getId() {
  return (0, _utils.uuidv4)();
}
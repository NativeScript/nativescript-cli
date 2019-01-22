"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.s4 = s4;
exports.uuidv4 = uuidv4;

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}

function uuidv4() {
  return "".concat(s4()).concat(s4(), "-").concat(s4(), "-").concat(s4(), "-").concat(s4(), "-").concat(s4()).concat(s4()).concat(s4());
}
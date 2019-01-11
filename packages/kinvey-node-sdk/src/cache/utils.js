"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateId = generateId;

// eslint-disable-next-line import/prefer-default-export
function generateId() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;
  var chars = 'abcdef0123456789';
  var id = '';

  for (var i = 0, j = chars.length; i < length; i += 1) {
    var pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}
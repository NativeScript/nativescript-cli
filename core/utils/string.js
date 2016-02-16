'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.byteCount = byteCount;
/**
 * @private
 */
function byteCount(str) {
  var count = 0;
  var stringLength = str.length;
  str = String(str || '');

  for (var i = 0; i < stringLength; i++) {
    var partCount = encodeURI(str[i]).split('%').length;
    count += partCount === 1 ? 1 : partCount - 1;
  }

  return count;
}
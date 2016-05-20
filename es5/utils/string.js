'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.byteCount = byteCount;
exports.randomString = randomString;

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function randomString(size) {
  var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  return '' + prefix + (0, _uid2.default)(size);
}
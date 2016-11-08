'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.randomString = randomString;

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function randomString(size) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  return '' + prefix + (0, _uid2.default)(size);
}
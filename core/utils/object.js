'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nested = nested;
exports.isDefined = isDefined;

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @private
 */
function nested(obj, dotProperty, value) {
  obj = (0, _clone2.default)(obj, true);

  if (!dotProperty) {
    obj = value ? value : obj;
    return obj;
  }

  var parts = dotProperty.split('.');
  var current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value ? value : obj;
}

/**
 * @private
 */
function isDefined(obj) {
  return obj !== undefined && obj !== null;
}
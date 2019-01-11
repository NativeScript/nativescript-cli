"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = min;

var _aggregation = _interopRequireDefault(require("./aggregation"));

/**
 * Creates an aggregation that will return the min value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function min() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var aggregation = new _aggregation.default({
    initial: {
      min: Infinity
    },
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.min = Math.min(result.min, doc[key]);
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
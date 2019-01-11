"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = count;

var _aggregation = _interopRequireDefault(require("./aggregation"));

/**
 * Creates an aggregation that will return the count for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function count() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var aggregation = new _aggregation.default({
    reduceFn: function reduceFn(result, doc, key) {
      var val = doc[key];

      if (val) {
        // eslint-disable-next-line no-param-reassign
        result[val] = typeof result[val] === 'undefined' ? 1 : result[val] + 1;
      }

      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
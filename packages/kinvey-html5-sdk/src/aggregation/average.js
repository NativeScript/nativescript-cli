"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = average;

var _aggregation = _interopRequireDefault(require("./aggregation"));

/**
 * Creates an aggregation that will return the average value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function average() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var aggregation = new _aggregation.default({
    initial: {
      count: 0,
      average: 0
    },
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.average = (result.average * result.count + doc[key]) / (result.count + 1); // eslint-disable-next-line no-param-reassign

      result.count += 1;
      return result;
    }
  });
  aggregation.by(field);
  return aggregation;
}
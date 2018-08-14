'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.count = count;
exports.sum = sum;
exports.min = min;
exports.max = max;
exports.average = average;

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This class represents an aggregation that can be used to group data.
 */
var Aggregation = function () {
  function Aggregation(aggregation) {
    _classCallCheck(this, Aggregation);

    var config = Object.assign({
      query: null,
      initial: {},
      fields: [],
      reduceFn: function reduceFn() {
        return null;
      }
    }, aggregation);

    this.query = config.query;
    this.initial = config.initial;
    this.fields = config.fields;
    this.reduceFn = config.reduceFn;
  }

  _createClass(Aggregation, [{
    key: 'by',


    /**
     * Adds the filed to the array of fields.
     *
     * @param {string} field
     * @returns {Aggregation} Aggregation
     */
    value: function by(field) {
      this.fields.push(field);
      return this;
    }
  }, {
    key: 'query',
    get: function get() {
      return this._query;
    },
    set: function set(query) {
      if (query && !(query instanceof _query2.default)) {
        throw new Error('Query must be an instance of Query class.');
      }

      this._query = query;
    }
  }, {
    key: 'fields',
    get: function get() {
      return this._fields;
    },
    set: function set(fields) {
      if (!(0, _isArray2.default)(fields)) {
        throw new Error('Please provide a valid fields. Fields must be an array of strings.');
      }

      this._fields = fields;
    }
  }]);

  return Aggregation;
}();

/**
 * Creates an aggregation that will return the count for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */


exports.default = Aggregation;
function count() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var aggregation = new Aggregation({
    fields: [field],
    reduceFn: function reduceFn(result, doc, key) {
      var val = doc[key];
      if (val) {
        // eslint-disable-next-line no-param-reassign
        result[val] = typeof result[val] === 'undefined' ? 1 : result[val] + 1;
      }
      return result;
    }
  });
  return aggregation;
}

/**
 * Creates an aggregation that will return the sum for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function sum() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var aggregation = new Aggregation({
    initial: { sum: 0 },
    fields: [field],
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.sum += doc[key];
      return result;
    }
  });
  return aggregation;
}

/**
 * Creates an aggregation that will return the min value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function min() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var aggregation = new Aggregation({
    initial: { min: Infinity },
    fields: [field],
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.min = Math.min(result.min, doc[key]);
      return result;
    }
  });
  return aggregation;
}

/**
 * Creates an aggregation that will return the max value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function max() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var aggregation = new Aggregation({
    initial: { max: -Infinity },
    fields: [field],
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.max = Math.max(result.max, doc[key]);
      return result;
    }
  });
  return aggregation;
}

/**
 * Creates an aggregation that will return the average value for a field on an array of data.
 *
 * @param {string} field Field
 * @returns {Aggregation} Aggregation
 */
function average() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var aggregation = new Aggregation({
    initial: { count: 0, average: 0 },
    fields: [field],
    reduceFn: function reduceFn(result, doc, key) {
      // eslint-disable-next-line no-param-reassign
      result.average = (result.average * result.count + doc[key]) / (result.count + 1);
      // eslint-disable-next-line no-param-reassign
      result.count += 1;
      return result;
    }
  });
  return aggregation;
}
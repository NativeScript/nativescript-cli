"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _query = _interopRequireDefault(require("../query"));

var Aggregation =
/*#__PURE__*/
function () {
  function Aggregation(aggregation) {
    (0, _classCallCheck2.default)(this, Aggregation);
    var config = Object.assign({}, {
      query: null,
      initial: {},
      key: {},
      reduceFn: function reduceFn() {
        return null;
      }
    }, aggregation);
    this.query = config.query;
    this.initial = config.initial;
    this.key = config.key;
    this.reduceFn = config.reduceFn;
  }

  (0, _createClass2.default)(Aggregation, [{
    key: "by",

    /**
     * Adds the filed to the array of fields.
     *
     * @param {string} field
     * @returns {Aggregation} Aggregation
     */
    value: function by(field) {
      this.key[field] = true;
      return this;
    }
  }, {
    key: "process",
    value: function process() {
      var _this = this;

      var docs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (docs.length > 0) {
        var fields = Object.keys(this.key);
        var filteredDocs = docs;

        if (this.query) {
          filteredDocs = this.query.process(docs);
        }

        if (fields.length > 0) {
          return fields.reduce(function (results, field) {
            results[field] = filteredDocs.reduce(function (result, doc) {
              return _this.reduceFn(result, doc, field) || result;
            }, Object.assign({}, _this.initial));
            return results;
          }, {});
        }

        return filteredDocs.reduce(function (result, doc) {
          return _this.reduceFn(doc, result) || result;
        }, Object.assign({}, this.initial));
      }

      return Object.assign({}, this.initial);
    }
  }, {
    key: "toPlainObject",
    value: function toPlainObject() {
      return {
        key: this.key,
        initial: this.initial,
        reduce: this.reduceFn,
        reduceFn: this.reduceFn,
        condition: this.query ? this.query.toPlainObject().filter : {},
        query: this.query ? this.query.toPlainObject() : null
      };
    }
  }, {
    key: "query",
    get: function get() {
      return this._query;
    },
    set: function set(query) {
      if (query && !(query instanceof _query.default)) {
        throw new Error('Query must be an instance of Query class.');
      }

      this._query = query;
    }
  }]);
  return Aggregation;
}();

exports.default = Aggregation;
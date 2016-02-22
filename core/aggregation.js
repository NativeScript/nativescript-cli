'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _query3 = require('./query');

var _query4 = _interopRequireDefault(_query3);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateAggregationSymbol = Symbol();

var PrivateAggregation = function () {
  function PrivateAggregation(options) {
    _classCallCheck(this, PrivateAggregation);

    options = (0, _assign2.default)({
      query: null,
      initial: {},
      key: {},
      reduce: function () {}.toString()
    }, options);

    this.query(options.query);
    this._initial = options.initial;
    this._key = options.key;
    this._reduce = options.reduce;
  }

  _createClass(PrivateAggregation, [{
    key: 'by',
    value: function by(field) {
      this._key[field] = true;
      return this;
    }
  }, {
    key: 'initial',
    value: function initial(objectOrKey, value) {
      if (typeof value === 'undefined' && !(0, _isObject2.default)(objectOrKey)) {
        throw new _errors.KinveyError('objectOrKey argument must be an Object.');
      }

      if ((0, _isObject2.default)(objectOrKey)) {
        this._initial = objectOrKey;
      } else {
        this._initial[objectOrKey] = value;
      }

      return this;
    }
  }, {
    key: 'query',
    value: function query(_query) {
      if (_query && !(_query instanceof _query4.default)) {
        _query = new _query4.default((0, _result2.default)(_query, 'toJSON', _query));
      }

      this._query = _query;
      return this;
    }
  }, {
    key: 'process',
    value: function process() {
      var documents = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      var groups = {};
      var response = [];
      var aggregation = this.toJSON();
      var reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
      aggregation.reduce = new Function(['doc', 'out'], reduce); // eslint-disable-line no-new-func

      if (this._query) {
        documents = this._query.process(documents);
      }

      (0, _forEach2.default)(documents, function (document) {
        var group = {};

        for (var name in document) {
          if (document.hasOwnProperty(name)) {
            group[name] = document[name];
          }
        }

        var key = JSON.stringify(group);
        if (!groups[key]) {
          groups[key] = group;

          for (var attr in aggregation.initial) {
            if (aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        aggregation.reduce(document, groups[key]);
      });

      for (var segment in groups) {
        if (groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }

      return response;
    }
  }, {
    key: 'reduce',
    value: function reduce(fn) {
      if ((0, _isFunction2.default)(fn)) {
        fn = fn.toString();
      }

      if (!(0, _isString2.default)(fn)) {
        throw new _errors.KinveyError('fn argument must be of type function or string.');
      }

      this._reduce = fn;
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        key: this._key,
        initial: this._initial,
        reduce: this._reduce,
        condition: this._query ? this._query.toJSON().filter : {},
        query: this._query ? this._query.toJSON() : null
      };

      return (0, _clone2.default)(json, true);
    }
  }]);

  return PrivateAggregation;
}();

var Aggregation = function () {
  function Aggregation(options) {
    _classCallCheck(this, Aggregation);

    this[privateAggregationSymbol] = new PrivateAggregation(options);
  }

  _createClass(Aggregation, [{
    key: 'by',
    value: function by(field) {
      this[privateAggregationSymbol].by(field);
      return this;
    }
  }, {
    key: 'initial',
    value: function initial(objectOrKey, value) {
      this[privateAggregationSymbol].initial(objectOrKey, value);
      return this;
    }
  }, {
    key: 'process',
    value: function process(response) {
      return this[privateAggregationSymbol].process(response);
    }
  }, {
    key: 'query',
    value: function query(_query2) {
      this[privateAggregationSymbol].query(_query2);
      return this;
    }
  }, {
    key: 'reduce',
    value: function reduce(fn) {
      this[privateAggregationSymbol].reduce(fn);
      return this;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateAggregationSymbol].toJSON();
    }
  }], [{
    key: 'count',
    value: function count() {
      var field = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var aggregation = new Aggregation();

      if (field) {
        aggregation.by(field);
      }

      aggregation.initial({ result: 0 });
      aggregation.reduce(function (doc, out) {
        out.result += 1;
      });
      return aggregation;
    }
  }, {
    key: 'sum',
    value: function sum() {
      var field = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial({ result: 0 });
      aggregation.reduce('function(doc, out) { ' + (' out.result += doc["' + field + '"]; ') + '}');
      return aggregation;
    }
  }, {
    key: 'min',
    value: function min() {
      var field = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial({ result: Infinity });
      aggregation.reduce('function(doc, out) { ' + (' out.result = Math.min(out.result, doc["' + field + '"]); ') + '}');
      return aggregation;
    }
  }, {
    key: 'max',
    value: function max() {
      var field = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial({ result: -Infinity });
      aggregation.reduce('function(doc, out) { ' + (' out.result = Math.max(out.result, doc["' + field + '"]); ') + '}');
      return aggregation;
    }
  }, {
    key: 'average',
    value: function average() {
      var field = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial({ count: 0, result: 0 });
      aggregation.reduce('function(doc, out) { ' + (' out.result = (out.result * out.count + doc["' + field + '"]) / (out.count + 1);') + ' out.count += 1;' + '}');
      return aggregation;
    }
  }]);

  return Aggregation;
}();

exports.default = Aggregation;
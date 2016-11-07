'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _errors = require('./errors');

var _query = require('./query');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Aggregation = function () {
  function Aggregation(options) {
    _classCallCheck(this, Aggregation);

    options = (0, _assign2.default)({
      query: null,
      initial: {},
      key: {},
      reduceFn: function () {}.toString()
    }, options);

    this.query = options.query;
    this.initial = options.initial;
    this.key = options.key;
    this.reduceFn = options.reduceFn;
  }

  _createClass(Aggregation, [{
    key: 'by',
    value: function by(field) {
      this.key[field] = true;
      return this;
    }
  }, {
    key: 'process',
    value: function process() {
      var entities = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var groups = {};
      var result = [];
      var aggregation = this.toJSON();
      var reduceFn = aggregation.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
      aggregation.reduce = new Function(['doc', 'out'], reduceFn);

      if (this.query) {
        entities = this.query.process(entities);
      }

      (0, _forEach2.default)(entities, function (entity) {
        var group = {};
        var entityNames = Object.keys(entity);

        (0, _forEach2.default)(entityNames, function (name) {
          group[name] = entity[name];
        });

        var key = JSON.stringify(group);
        if (!groups[key]) {
          groups[key] = group;
          var attributes = Object.keys(aggregation.initial);

          (0, _forEach2.default)(attributes, function (attr) {
            groups[key][attr] = aggregation.initial[attr];
          });
        }

        aggregation.reduce(entity, groups[key]);
      });

      var segments = Object.keys(groups);
      (0, _forEach2.default)(segments, function (segment) {
        result.push(groups[segment]);
      });

      return result;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        key: this.key,
        initial: this.initial,
        reduceFn: this.reduceFn,
        condition: this.query ? this.query.toJSON().filter : {},
        query: this.query ? this.query.toJSON() : null
      };

      return json;
    }
  }, {
    key: 'initial',
    get: function get() {
      return this._initial;
    },
    set: function set(initial) {
      if (!(0, _isObject2.default)(initial)) {
        throw new _errors.KinveyError('initial must be an Object.');
      }

      this._initial = initial;
    }
  }, {
    key: 'query',
    get: function get() {
      return this._query;
    },
    set: function set(query) {
      if ((0, _utils.isDefined)(query) && !(query instanceof _query.Query)) {
        throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');
      }

      this._query = query;
    }
  }, {
    key: 'reduceFn',
    get: function get() {
      return this._reduceFn;
    },
    set: function set(fn) {
      if ((0, _isFunction2.default)(fn)) {
        fn = fn.toString();
      }

      if (!(0, _isString2.default)(fn)) {
        throw new _errors.KinveyError('fn argument must be of type function or string.');
      }

      this._reduceFn = fn;
    }
  }], [{
    key: 'count',
    value: function count() {
      var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var aggregation = new Aggregation();

      if (field) {
        aggregation.by(field);
      }

      aggregation.initial = { result: 0 };
      aggregation.reduceFn = function (doc, out) {
        out.result += 1;
        return out;
      };
      return aggregation;
    }
  }, {
    key: 'sum',
    value: function sum() {
      var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial = { result: 0 };
      aggregation.reduceFn = function (doc, out) {
        out.result += doc['\'' + field + '\''];
      };
      return aggregation;
    }
  }, {
    key: 'min',
    value: function min() {
      var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial = { result: Infinity };
      aggregation.reduceFn = function (doc, out) {
        out.result = Math.min(out.result, doc['\'' + field + '\'']);
      };
      return aggregation;
    }
  }, {
    key: 'max',
    value: function max() {
      var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial = { result: -Infinity };
      aggregation.reduceFn = function (doc, out) {
        out.result = Math.max(out.result, doc['\'' + field + '\'']);
      };
      return aggregation;
    }
  }, {
    key: 'average',
    value: function average() {
      var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      field = field.replace('\'', '\\\'');

      var aggregation = new Aggregation();
      aggregation.initial = { count: 0, result: 0 };
      aggregation.reduceFn = function (doc, out) {
        out.result = (out.result * out.count + doc['\'' + field + '\'']) / (out.count + 1);
        out.count += 1;
      };
      return aggregation;
    }
  }]);

  return Aggregation;
}();

exports.default = Aggregation;
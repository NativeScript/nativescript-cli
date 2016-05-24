'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Query = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('./utils/object');

var _sift = require('sift');

var _sift2 = _interopRequireDefault(_sift);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isRegExp = require('lodash/isRegExp');

var _isRegExp2 = _interopRequireDefault(_isRegExp);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(options) {
    _classCallCheck(this, Query);

    options = (0, _assign2.default)({
      fields: [],
      filter: {},
      sort: {},
      limit: null,
      skip: 0
    }, options);

    /**
     * Fields to select.
     *
     * @type {Array}
     */
    this.fields = options.fields;

    /**
     * The MongoDB query.
     *
     * @type {Object}
     */
    this.filter = options.filter;

    /**
     * The sorting order.
     *
     * @type {Object}
     */
    this.sort = options.sort;

    /**
     * Number of documents to select.
     *
     * @type {?Number}
     */
    this.limit = options.limit;

    /**
     * Number of documents to skip from the start.
     *
     * @type {Number}
     */
    this.skip = options.skip;

    /**
     * Maintain reference to the parent query in case the query is part of a
     * join.
     *
     * @type {?PrivateQuery}
     */
    this.parent = null;
  }

  _createClass(Query, [{
    key: 'equalTo',


    /**
     * Adds an equal to filter to the query. Requires `field` to equal `value`.
     * Any existing filters on `field` will be discarded.
     * http://docs.mongodb.org/manual/reference/operators/#comparison
     *
     * @param   {String}        field     Field.
     * @param   {*}             value     Value.
     * @returns {Query}                   The query.
     */
    value: function equalTo(field, value) {
      this.filter[field] = value;
      return this;
    }

    /**
     * Adds a contains filter to the query. Requires `field` to contain at least
     * one of the members of `list`.
     * http://docs.mongodb.org/manual/reference/operator/in/
     *
     * @param   {String}        field     Field.
     * @param   {Array}         values    List of values.
     * @throws  {Error}                   `values` must be of type: `Array`.
     * @returns {Query}                   The query.
     */

  }, {
    key: 'contains',
    value: function contains(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$in', values);
    }

    /**
     * Adds a contains all filter to the query. Requires `field` to contain all
     * members of `list`.
     * http://docs.mongodb.org/manual/reference/operator/all/
     *
     * @param   {String}  field     Field.
     * @param   {Array}   values    List of values.
     * @throws  {Error}             `values` must be of type: `Array`.
     * @returns {Query}             The query.
     */

  }, {
    key: 'containsAll',
    value: function containsAll(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$all', values);
    }

    /**
     * Adds a greater than filter to the query. Requires `field` to be greater
     * than `value`.
     * http://docs.mongodb.org/manual/reference/operator/gt/
     *
     * @param   {String}          field     Field.
     * @param   {Number|String}   value     Value.
     * @throws  {Error}                     `value` must be of type: `number` or `string`.
     * @returns {Query}                     The query.
     */

  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$gt', value);
    }
  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$gte', value);
    }
  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$lt', value);
    }
  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new Error('You must supply a number or string.');
      }

      return this.addFilter(field, '$lte', value);
    }
  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      return this.addFilter(field, '$ne', value);
    }
  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$nin', values);
    }
  }, {
    key: 'and',
    value: function and() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this.join('$and', Array.prototype.slice.call(args));
    }
  }, {
    key: 'nor',
    value: function nor() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (this.parent && this.parent.filter.$and) {
        return this.parent.nor.apply(this.parent, args);
      }

      return this.join('$nor', Array.prototype.slice.call(args));
    }
  }, {
    key: 'or',
    value: function or() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (this.parent) {
        return this.parent.or.apply(this.parent, args);
      }

      return this.join('$or', Array.prototype.slice.call(args));
    }
  }, {
    key: 'exists',
    value: function exists(field, flag) {
      flag = typeof flag === 'undefined' ? true : flag || false;
      return this.addFilter(field, '$exists', flag);
    }
  }, {
    key: 'mod',
    value: function mod(field, divisor, remainder) {
      remainder = remainder || 0;

      if ((0, _isString2.default)(divisor)) {
        divisor = parseFloat(divisor);
      }

      if ((0, _isString2.default)(remainder)) {
        remainder = parseFloat(remainder);
      }

      if (!(0, _isNumber2.default)(divisor)) {
        throw new Error('divisor must be a number');
      }

      if (!(0, _isNumber2.default)(remainder)) {
        throw new Error('remainder must be a number');
      }

      return this.addFilter(field, '$mod', [divisor, remainder]);
    }
  }, {
    key: 'matches',
    value: function matches(field, regExp, options) {
      options = options || {};

      if (!(0, _isRegExp2.default)(regExp)) {
        regExp = new RegExp(regExp);
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new Error('ignoreCase glag is not supported.');
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new Error('regExp must have `^` at the beginning of the expression ' + 'to make it an anchored expression.');
      }

      var flags = [];

      if ((regExp.multiline || options.multiline) && options.multiline !== false) {
        flags.push('m');
      }

      if (options.extended) {
        flags.push('x');
      }

      if (options.dotMatchesAll) {
        flags.push('s');
      }

      var result = this.addFilter(field, '$regex', regExp.source);

      if (flags.length) {
        this.addFilter(field, '$options', flags.join(''));
      }

      return result;
    }
  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      if (!(0, _isArray2.default)(coord) || !coord[0] || !coord[1]) {
        throw new Error('coord must be a [number, number]');
      }

      coord[0] = parseFloat(coord[0]);
      coord[1] = parseFloat(coord[1]);

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if (maxDistance) {
        this.addFilter(field, '$maxDistance', maxDistance);
      }

      return result;
    }
  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!(0, _isArray2.default)(bottomLeftCoord) || !bottomLeftCoord[0] || !bottomLeftCoord[1]) {
        throw new Error('bottomLeftCoord must be a [number, number]');
      }

      if (!(0, _isArray2.default)(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
        throw new Error('upperRightCoord must be a [number, number]');
      }

      bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
      bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
      upperRightCoord[0] = parseFloat(upperRightCoord[0]);
      upperRightCoord[1] = parseFloat(upperRightCoord[1]);

      var coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
      return this.addFilter(field, '$within', { $box: coords });
    }
  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      if (!(0, _isArray2.default)(coords) || coords.length > 3) {
        throw new Error('coords must be [[number, number]]');
      }

      coords = coords.map(function (coord) {
        if (!coord[0] || !coord[1]) {
          throw new Error('coords argument must be [number, number]');
        }

        return [parseFloat(coord[0]), parseFloat(coord[1])];
      });

      return this.addFilter(field, '$within', { $polygon: coords });
    }
  }, {
    key: 'size',
    value: function size(field, _size) {
      if ((0, _isString2.default)(_size)) {
        _size = parseFloat(_size);
      }

      if (!(0, _isNumber2.default)(_size)) {
        throw new Error('size must be a number');
      }

      return this.addFilter(field, '$size', _size);
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      if (this.parent) {
        this.parent.ascending(field);
      } else {
        this.sort[field] = 1;
      }

      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      if (this.parent) {
        this.parent.descending(field);
      } else {
        this.sort[field] = -1;
      }

      return this;
    }

    /**
     * Adds a filter to the query.
     *
     * @param   {String}          field       Field.
     * @param   {String}          condition   Condition.
     * @param   {*}               value       Value.
     * @returns {PrivateQuery}                The query.
     */

  }, {
    key: 'addFilter',
    value: function addFilter(field, condition, values) {
      if (!(0, _isObject2.default)(this.filter[field])) {
        this.filter[field] = {};
      }

      this.filter[field][condition] = values;
      return this;
    }

    /**
     * Joins the current query with another query using an operator.
     *
     * @param   {String}                    operator    Operator.
     * @param   {PrivateQuery[]|Object[]}   queries     Queries.
     * @throws  {Error}                                `query` must be of type: `Kinvey.Query[]` or `Object[]`.
     * @returns {PrivateQuery}                          The query.
     */

  }, {
    key: 'join',
    value: function join(operator, queries) {
      var _this = this;

      var that = this;
      var currentQuery = {};

      // Cast, validate, and parse arguments. If `queries` are supplied, obtain
      // the `filter` for joining. The eventual return function will be the
      // current query.
      queries = queries.map(function (query) {
        if (!(query instanceof Query)) {
          if ((0, _isObject2.default)(query)) {
            query = new Query(query);
          } else {
            throw new Error('query argument must be of type: Kinvey.Query[] or Object[].');
          }
        }

        return query.toJSON().filter;
      });

      // If there are no `queries` supplied, create a new (empty) `Query`.
      // This query is the right-hand side of the join expression, and will be
      // returned to allow for a fluent interface.
      if (queries.length === 0) {
        that = new Query();
        queries = [that.toJSON().filter];
        that.parent = this; // Required for operator precedence and `toJSON`.
      }

      // Join operators operate on the top-level of `filter`. Since the `toJSON`
      // magic requires `filter` to be passed by reference, we cannot simply re-
      // assign `filter`. Instead, empty it without losing the reference.
      var members = Object.keys(this.filter);
      (0, _forEach2.default)(members, function (member) {
        currentQuery[member] = _this.filter[member];
        delete _this.filter[member];
      });

      // `currentQuery` is the left-hand side query. Join with `queries`.
      this.filter[operator] = [currentQuery].concat(queries);

      // Return the current query if there are `queries`, and the new (empty)
      // `PrivateQuery` otherwise.
      return that;
    }

    /**
     * Processes the data by applying fields, sort, limit, and skip.
     *
     * @param   {Array}   data    The raw data.
     * @throws  {Error}               `data` must be of type: `Array`.
     * @returns {Array}               The processed data.
     */

  }, {
    key: '_process',
    value: function _process(data) {
      var _this2 = this;

      if (data) {
        var _ret = function () {
          // Validate arguments.
          if (!(0, _isArray2.default)(data)) {
            throw new Error('data argument must be of type: Array.');
          }

          // Apply the query
          var json = _this2.toJSON();
          data = (0, _sift2.default)(json.filter, data);

          // Remove fields
          if (json.fields && json.fields.length > 0) {
            data = data.map(function (item) {
              var keys = Object.keys(item);
              (0, _forEach2.default)(keys, function (key) {
                if (json.fields.indexOf(key) === -1) {
                  delete item[key];
                }
              });

              return item;
            });
          }

          // Sorting.
          data = data.sort(function (a, b) {
            var fields = Object.keys(json.sort);
            (0, _forEach2.default)(fields, function (field) {
              // Find field in objects.
              var aField = (0, _object.nested)(a, field);
              var bField = (0, _object.nested)(b, field);

              // Elements which do not contain the field should always be sorted
              // lower.
              if (aField && !bField) {
                return -1;
              }

              if (bField && !aField) {
                return 1;
              }

              // Sort on the current field. The modifier adjusts the sorting order
              // (ascending (-1), or descending(1)). If the fields are equal,
              // continue sorting based on the next field (if any).
              if (aField !== bField) {
                var modifier = json.sort[field]; // 1 or -1.
                return (aField < bField ? -1 : 1) * modifier;
              }

              return 0;
            });

            return 0;
          });

          // Limit and skip.
          if (json.limit) {
            return {
              v: data.slice(json.skip, json.skip + json.limit)
            };
          }

          return {
            v: data.slice(json.skip)
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }

      return data;
    }

    /**
     * Returns JSON representation of the query.
     *
     * @returns {Object} JSON object-literal.
     */

  }, {
    key: 'toJSON',
    value: function toJSON() {
      if (this.parent) {
        return this.parent.toJSON();
      }

      // Return set of parameters.
      var json = {
        fields: this.fields,
        filter: this.filter,
        sort: this.sort,
        skip: this.skip,
        limit: this.limit
      };

      return json;
    }

    /**
     * Returns serialized representation that can be appended
     * to network paths as a query parameter.
     *
     * @returns {Object} Query string object
     */

  }, {
    key: 'toQueryString',
    value: function toQueryString() {
      var queryString = {};

      if (!(0, _isEmpty2.default)(this.filter)) {
        queryString.query = this.filter;
      }

      if (!(0, _isEmpty2.default)(this.fields)) {
        queryString.fields = this.fields.join(',');
      }

      if (this.limit) {
        queryString.limit = this.limit;
      }

      if (this.skip > 0) {
        queryString.skip = this.skip;
      }

      if (!(0, _isEmpty2.default)(this.sort)) {
        queryString.sort = this.sort;
      }

      var keys = Object.keys(queryString);
      (0, _forEach2.default)(keys, function (key) {
        queryString[key] = (0, _isString2.default)(queryString[key]) ? queryString[key] : JSON.stringify(queryString[key]);
      });

      return queryString;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return JSON.stringify(this.toQueryString());
    }
  }, {
    key: 'fields',
    get: function get() {
      return this.queryFields;
    },
    set: function set(fields) {
      fields = fields || [];

      if (!(0, _isArray2.default)(fields)) {
        throw new Error('fields must be an Array');
      }

      if (this.parent) {
        this.parent.fields = fields;
      } else {
        this.queryFields = fields;
      }
    }
  }, {
    key: 'filter',
    get: function get() {
      return this.queryFilter;
    },
    set: function set(filter) {
      this.queryFilter = filter;
    }
  }, {
    key: 'sort',
    get: function get() {
      return this.querySort;
    },
    set: function set(sort) {
      if (sort && !(0, _isObject2.default)(sort)) {
        throw new Error('sort must an Object');
      }

      if (this.parent) {
        this.parent.sort(sort);
      } else {
        this.querySort = sort || {};
      }
    }
  }, {
    key: 'limit',
    get: function get() {
      return this.queryLimit;
    },
    set: function set(limit) {
      if ((0, _isString2.default)(limit)) {
        limit = parseFloat(limit);
      }

      if (limit && !(0, _isNumber2.default)(limit)) {
        throw new Error('limit must be a number');
      }

      if (this.parent) {
        this.parent.limit = limit;
      } else {
        this.queryLimit = limit;
      }
    }
  }, {
    key: 'skip',
    get: function get() {
      return this.querySkip;
    },
    set: function set(skip) {
      if ((0, _isString2.default)(skip)) {
        skip = parseFloat(skip);
      }

      if (!(0, _isNumber2.default)(skip)) {
        throw new Error('skip must be a number');
      }

      if (this.parent) {
        this.parent.skip(skip);
      } else {
        this.querySkip = skip;
      }
    }
  }]);

  return Query;
}();

exports.Query = Query;
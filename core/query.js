'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('./utils/object');

var _sift = require('sift');

var _sift2 = _interopRequireDefault(_sift);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privateQuerySymbol = Symbol();

var PrivateQuery = function () {
  function PrivateQuery(options) {
    _classCallCheck(this, PrivateQuery);

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
    this._fields = options.fields;

    /**
     * The MongoDB query.
     *
     * @type {Object}
     */
    this._filter = options.filter;

    /**
     * The sorting order.
     *
     * @type {Object}
     */
    this._sort = options.sort;

    /**
     * Number of documents to select.
     *
     * @type {?Number}
     */
    this._limit = options.limit;

    /**
     * Number of documents to skip from the start.
     *
     * @type {Number}
     */
    this._skip = options.skip;

    /**
     * Maintain reference to the parent query in case the query is part of a
     * join.
     *
     * @type {?PrivateQuery}
     */
    this.parent = null;
  }

  /**
   * Adds an equal to filter to the query. Requires `field` to equal `value`.
   * Any existing filters on `field` will be discarded.
   * http://docs.mongodb.org/manual/reference/operators/#comparison
   *
   * @param   {String}        field     Field.
   * @param   {*}             value     Value.
   * @returns {Query}                   The query.
   */


  _createClass(PrivateQuery, [{
    key: 'equalTo',
    value: function equalTo(field, value) {
      this._filter[field] = value;
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
      return this.join('$and', Array.prototype.slice.call(arguments));
    }
  }, {
    key: 'nor',
    value: function nor() {
      if (this.parent && this.parent.filter.$and) {
        return this.parent.nor.apply(this.parent, arguments);
      }

      return this.join('$nor', Array.prototype.slice.call(arguments));
    }
  }, {
    key: 'or',
    value: function or() {
      if (this.parent) {
        return this.parent.or.apply(this.parent, arguments);
      }

      return this.join('$or', Array.prototype.slice.call(arguments));
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
        throw new Error('Divisor must be a number.');
      }

      if (!(0, _isNumber2.default)(remainder)) {
        throw new Error('Remainder must be a number.');
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
        throw new Error('coord argument must be of type: [number, number]');
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
        throw new Error('bottomLeftCoord argument must be of type: [number, number]');
      }

      if (!(0, _isArray2.default)(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
        throw new Error('upperRightCoord argument must be of type: [number, number]');
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
        throw new Error('coords argument must be of type: [[number, number]]');
      }

      coords = coords.map(function (coord) {
        if (!coord[0] || !coord[1]) {
          throw new Error('coords argument must be of type: [number, number]');
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
        throw new Error('size argument must be a number');
      }

      return this.addFilter(field, '$size', _size);
    }
  }, {
    key: 'fields',
    value: function fields(_fields) {
      _fields = _fields || [];

      if (!(0, _isArray2.default)(_fields)) {
        throw new Error('fields argument must an Array.');
      }

      if (this.parent) {
        this.parent.fields(_fields);
      } else {
        this._fields = _fields;
      }

      return this;
    }
  }, {
    key: 'limit',
    value: function limit(_limit) {
      if ((0, _isString2.default)(_limit)) {
        _limit = parseFloat(_limit);
      }

      if (_limit && !(0, _isNumber2.default)(_limit)) {
        throw new Error('limit argument must be of type: number.');
      }

      if (this._parent) {
        this.parent.limit(_limit);
      } else {
        this._limit = _limit;
      }

      return this;
    }
  }, {
    key: 'skip',
    value: function skip(_skip) {
      if ((0, _isString2.default)(_skip)) {
        _skip = parseFloat(_skip);
      }

      if (!(0, _isNumber2.default)(_skip)) {
        throw new Error('skip argument must be of type: number.');
      }

      if (this.parent) {
        this.parent.skip(_skip);
      } else {
        this._skip = _skip;
      }

      return this;
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      if (this.parent) {
        this.parent.ascending(field);
      } else {
        this._sort[field] = 1;
      }

      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      if (this.parent) {
        this.parent.descending(field);
      } else {
        this._sort[field] = -1;
      }

      return this;
    }
  }, {
    key: 'sort',
    value: function sort(_sort) {
      if (_sort && !(0, _isObject2.default)(_sort)) {
        throw new Error('sort argument must be of type: Object.');
      }

      if (this.parent) {
        this.parent.sort(_sort);
      } else {
        this._sort = _sort || {};
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
      if (!(0, _isObject2.default)(this._filter[field])) {
        this._filter[field] = {};
      }

      this._filter[field][condition] = values;
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
      var currentQuery = {};

      // Cast, validate, and parse arguments. If `queries` are supplied, obtain
      // the `filter` for joining. The eventual return function will be the
      // current query.
      queries = queries.map(function (query) {
        if (!(query instanceof PrivateQuery)) {
          if ((0, _isObject2.default)(query)) {
            query = new PrivateQuery(query);
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
        _this = new PrivateQuery();
        queries = [_this.toJSON().filter];
        _this.parent = this; // Required for operator precedence and `toJSON`.
      }

      // Join operators operate on the top-level of `filter`. Since the `toJSON`
      // magic requires `filter` to be passed by reference, we cannot simply re-
      // assign `filter`. Instead, empty it without losing the reference.
      for (var member in this._filter) {
        if (this._filter.hasOwnProperty(member)) {
          currentQuery[member] = this._filter[member];
          delete this._filter[member];
        }
      }

      // `currentQuery` is the left-hand side query. Join with `queries`.
      this._filter[operator] = [currentQuery].concat(queries);

      // Return the current query if there are `queries`, and the new (empty)
      // `PrivateQuery` otherwise.
      return _this;
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
              for (var key in item) {
                if (item.hasOwnProperty(key) && json.fields.indexOf(key) === -1) {
                  delete item[key];
                }
              }

              return item;
            });
          }

          // Sorting.
          data = data.sort(function (a, b) {
            for (var field in json.sort) {
              if (json.sort.hasOwnProperty(field)) {
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
              }
            }

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
        fields: this._fields,
        filter: this._filter,
        sort: this._sort,
        skip: this._skip,
        limit: this._limit
      };

      return (0, _clone2.default)(json, true);
    }
  }]);

  return PrivateQuery;
}();

var Query = function () {
  function Query(options) {
    _classCallCheck(this, Query);

    this[privateQuerySymbol] = new PrivateQuery(options);
  }

  /**
   * Adds an equal to filter to the query. Requires `field` to equal `value`.
   * Any existing filters on `field` will be discarded.
   * http://docs.mongodb.org/manual/reference/operators/#comparison
   *
   * @param   {String}        field     Field.
   * @param   {*}             value     Value.
   * @returns {Query}                   The query.
   */


  _createClass(Query, [{
    key: 'equalTo',
    value: function equalTo(field, value) {
      this[privateQuerySymbol].equalTo(field, value);
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
      this[privateQuerySymbol].contains(field, values);
      return this;
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
      this[privateQuerySymbol].containsAll(field, values);
      return this;
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
      this[privateQuerySymbol].greaterThan(field, value);
      return this;
    }
  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      this[privateQuerySymbol].greaterThanOrEqualToe(field, value);
      return this;
    }
  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      this[privateQuerySymbol].lessThan(field, value);
      return this;
    }
  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      this[privateQuerySymbol].lessThanOrEqualTo(field, value);
      return this;
    }
  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      this[privateQuerySymbol].notEqualTo(field, value);
      return this;
    }
  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      this[privateQuerySymbol].notContainedIn(field, values);
      return this;
    }
  }, {
    key: 'and',
    value: function and() {
      this[privateQuerySymbol].and.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'nor',
    value: function nor() {
      this[privateQuerySymbol].nor.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'or',
    value: function or() {
      this[privateQuerySymbol].or.apply(this[privateQuerySymbol], arguments);
      return this;
    }
  }, {
    key: 'exists',
    value: function exists(field, flag) {
      this[privateQuerySymbol].exists(field, flag);
      return this;
    }
  }, {
    key: 'mod',
    value: function mod(field, divisor, remainder) {
      this[privateQuerySymbol].mod(field, divisor, remainder);
      return this;
    }
  }, {
    key: 'matches',
    value: function matches(field, regExp, options) {
      this[privateQuerySymbol].matches(field, regExp, options);
      return this;
    }
  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      this[privateQuerySymbol].near(field, coord, maxDistance);
      return this;
    }
  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      this[privateQuerySymbol].withinBox(field, bottomLeftCoord, upperRightCoord);
      return this;
    }
  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      this[privateQuerySymbol].withinPolygon(field, coords);
      return this;
    }
  }, {
    key: 'size',
    value: function size(field, _size2) {
      this[privateQuerySymbol].size(field, _size2);
      return this;
    }
  }, {
    key: 'fields',
    value: function fields(_fields2) {
      this[privateQuerySymbol].fields(_fields2);
      return this;
    }
  }, {
    key: 'limit',
    value: function limit(_limit2) {
      this[privateQuerySymbol].limit(_limit2);
      return this;
    }
  }, {
    key: 'skip',
    value: function skip(_skip2) {
      this[privateQuerySymbol].skip(_skip2);
      return this;
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      this[privateQuerySymbol].ascending(field);
      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      this[privateQuerySymbol].descending(field);
      return this;
    }
  }, {
    key: 'sort',
    value: function sort(_sort2) {
      this[privateQuerySymbol].sort(_sort2);
      return this;
    }
  }, {
    key: '_process',
    value: function _process(data) {
      return this[privateQuerySymbol]._process(data);
    }

    /**
     * Returns JSON representation of the query.
     *
     * @returns {Object} JSON object-literal.
     */

  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this[privateQuerySymbol].toJSON();
    }
  }]);

  return Query;
}();

exports.default = Query;
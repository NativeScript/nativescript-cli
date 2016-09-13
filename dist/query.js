'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Query = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _utils = require('./utils');

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

var _findKey = require('lodash/findKey');

var _findKey2 = _interopRequireDefault(_findKey);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var unsupportedFilters = ['$nearSphere'];

/**
 * The Query class is used to query for a subset of
 * entities using the Kinvey API.
 *
 * @example
 * var query = new Kinvey.Query();
 * query.equalTo('name', 'Kinvey');
 */

var Query = function () {
  /**
   * Create an instance of the Query class.
   *
   * @param {Object} options Options
   * @param {string[]} [options.fields=[]] Fields to select.
   * @param {Object} [options.filter={}] MongoDB query.
   * @param {Object} [options.sort={}] The sorting order.
   * @param {?number} [options.limit=null] Number of entities to select.
   * @param {number} [options.skip=0] Number of entities to skip from the start.
   * @return {Query} The query.
   */
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
     * @type {string[]}
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
     * Number of entities to select.
     *
     * @type {?number}
     */
    this.limit = options.limit;

    /**
     * Number of entities to skip from the start.
     *
     * @type {number}
     */
    this.skip = options.skip;

    /**
     * Maintain reference to the parent query in case the query is part of a
     * join.
     *
     * @type {?Query}
     */
    this._parent = null;
  }

  /**
   * @type {string[]}
   */


  _createClass(Query, [{
    key: 'isSupportedOffline',


    /**
     * Checks if the query is able to be run offline on the local cache.
     * @return {Boolean} True if it is able to be run offline otherwise false.
     */
    value: function isSupportedOffline() {
      var _this = this;

      var supported = true;

      (0, _forEach2.default)(unsupportedFilters, function (filter) {
        supported = !(0, _findKey2.default)(_this.filter, filter);
        return supported;
      });

      return supported;
    }

    /**
     * Adds an equal to filter to the query. Requires `field` to equal `value`.
     * Any existing filters on `field` will be discarded.
     * @see https://docs.mongodb.com/manual/reference/operator/query/#comparison
     *
     * @param {string} field Field
     * @param {*} value Value
     * @returns {Query} The query.
     */

  }, {
    key: 'equalTo',
    value: function equalTo(field, value) {
      return this.addFilter(field, value);
    }

    /**
     * Adds a contains filter to the query. Requires `field` to contain at least
     * one of the members of `list`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/in
     *
     * @param {string} field Field
     * @param {array} values List of values.
     * @throws {QueryError} `values` must be of type `Array`.
     * @returns {Query} The query.
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
     * @see https://docs.mongodb.com/manual/reference/operator/query/all
     *
     * @param {string} field Field
     * @param {Array} values List of values.
     * @throws {QueryError} `values` must be of type `Array`.
     * @returns {Query} The query.
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
     * @see https://docs.mongodb.com/manual/reference/operator/query/gt
     *
     * @param {string} field Field
     * @param {number|string} value Value
     * @throws {QueryError} `value` must be of type `number` or `string`.
     * @returns {Query} The query.
     */

  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$gt', value);
    }

    /**
     * Adds a greater than or equal to filter to the query. Requires `field` to
     * be greater than or equal to `value`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/gte
     *
     * @param {string} field Field.
     * @param {number|string} value Value.
     * @throws {QueryError} `value` must be of type `number` or `string`.
     * @returns {Query} The query.
     */

  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$gte', value);
    }

    /**
     * Adds a less than filter to the query. Requires `field` to be less than
     * `value`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/lt
     *
     * @param {string} field Field
     * @param {number|string} value Value
     * @throws {QueryError} `value` must be of type `number` or `string`.
     * @returns {Query} The query.
     */

  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$lt', value);
    }

    /**
     * Adds a less than or equal to filter to the query. Requires `field` to be
     * less than or equal to `value`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/lte
     *
     * @param {string} field Field
     * @param {number|string} value Value
     * @throws {QueryError} `value` must be of type `number` or `string`.
     * @returns {Query} The query.
     */

  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$lte', value);
    }

    /**
     * Adds a not equal to filter to the query. Requires `field` not to equal
     * `value`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/ne
     *
     * @param {string} field Field
     * @param {*} value Value
     * @returns {Query} The query.
     */

  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      return this.addFilter(field, '$ne', value);
    }

    /**
     * Adds a not contained in filter to the query. Requires `field` not to
     * contain any of the members of `list`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/nin
     *
     * @param {string} field Field
     * @param {Array} values List of values.
     * @throws {QueryError} `values` must be of type `Array`.
     * @returns {Query} The query.
     */

  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$nin', values);
    }

    /**
     * Performs a logical AND operation on the query and the provided queries.
     * @see https://docs.mongodb.com/manual/reference/operator/query/and
     *
     * @param {...Query|...Object} args Queries
     * @throws {QueryError} `query` must be of type `Array<Query>` or `Array<Object>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'and',
    value: function and() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // AND has highest precedence. Therefore, even if this query is part of a
      // JOIN already, apply it on this query.
      return this.join('$and', args);
    }

    /**
     * Performs a logical NOR operation on the query and the provided queries.
     * @see https://docs.mongodb.com/manual/reference/operator/query/nor
     *
     * @param {...Query|...Object} args Queries
     * @throws {QueryError} `query` must be of type `Array<Query>` or `Array<Object>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'nor',
    value: function nor() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
      // apply the NOR onto the parent to make sure AND indeed precedes NOR.
      if (this._parent && this._parent.filter.$and) {
        return this._parent.nor.apply(this._parent, args);
      }

      return this.join('$nor', args);
    }

    /**
     * Performs a logical OR operation on the query and the provided queries.
     * @see https://docs.mongodb.com/manual/reference/operator/query/or
     *
     * @param {...Query|...Object} args Queries.
     * @throws {QueryError} `query` must be of type `Array<Query>` or `Array<Object>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'or',
    value: function or() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      // OR has lowest precedence. Therefore, if this query is part of any join,
      // apply the OR onto the parent to make sure OR has indeed the lowest
      // precedence.
      if (this._parent) {
        return this._parent.or.apply(this._parent, args);
      }

      return this.join('$or', args);
    }

    /**
     * Adds an exists filter to the query. Requires `field` to exist if `flag` is
     * `true`, or not to exist if `flag` is `false`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/exists
     *
     * @param {string} field Field
     * @param {boolean} [flag=true] The exists flag.
     * @returns {Query} The query.
     */

  }, {
    key: 'exists',
    value: function exists(field, flag) {
      flag = typeof flag === 'undefined' ? true : flag || false;
      return this.addFilter(field, '$exists', flag);
    }

    /**
     * Adds a modulus filter to the query. Requires `field` modulo `divisor` to
     * have remainder `remainder`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/mod
     *
     * @param {string} field Field
     * @param {number} divisor Divisor
     * @param {number} [remainder=0] Remainder
     * @throws {QueryError} `divisor` must be of type: `number`.
     * @throws {QueryError} `remainder` must be of type: `number`.
     * @returns {Query} The query.
     */

  }, {
    key: 'mod',
    value: function mod(field, divisor) {
      var remainder = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if ((0, _isString2.default)(divisor)) {
        divisor = parseFloat(divisor);
      }

      if ((0, _isString2.default)(remainder)) {
        remainder = parseFloat(remainder);
      }

      if (!(0, _isNumber2.default)(divisor)) {
        throw new _errors.QueryError('divisor must be a number');
      }

      if (!(0, _isNumber2.default)(remainder)) {
        throw new _errors.QueryError('remainder must be a number');
      }

      return this.addFilter(field, '$mod', [divisor, remainder]);
    }

    /**
     * Adds a match filter to the query. Requires `field` to match `regExp`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/regex
     *
     * @param {string} field Field
     * @param {RegExp|string} regExp Regular expression.
     * @param {Object} [options] Options
     * @param {boolean} [options.ignoreCase=inherit] Toggles case-insensitivity.
     * @param {boolean} [options.multiline=inherit] Toggles multiline matching.
     * @param {boolean} [options.extended=false] Toggles extended capability.
     * @param {boolean} [options.dotMatchesAll=false] Toggles dot matches all.
     * @returns {Query} The query.
     */

  }, {
    key: 'matches',
    value: function matches(field, regExp) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!(0, _isRegExp2.default)(regExp)) {
        regExp = new RegExp(regExp);
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new _errors.QueryError('ignoreCase glag is not supported.');
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new _errors.QueryError('regExp must have `^` at the beginning of the expression ' + 'to make it an anchored expression.');
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

    /**
     * Adds a near filter to the query. Requires `field` to be a coordinate
     * within `maxDistance` of `coord`. Sorts documents from nearest to farthest.
     * @see https://docs.mongodb.com/manual/reference/operator/query/near
     *
     * @param {string} field The field.
     * @param {Array<number, number>} coord The coordinate (longitude, latitude).
     * @param {number} [maxDistance] The maximum distance (miles).
     * @throws {QueryError} `coord` must be of type `Array<number, number>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      if (!(0, _isArray2.default)(coord) || !(0, _isNumber2.default)(coord[0]) || !(0, _isNumber2.default)(coord[1])) {
        throw new _errors.QueryError('coord must be a [number, number]');
      }

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if (maxDistance) {
        this.addFilter(field, '$maxDistance', maxDistance);
      }

      return result;
    }

    /**
     * Adds a within box filter to the query. Requires `field` to be a coordinate
     * within the bounds of the rectangle defined by `bottomLeftCoord`,
     * `bottomRightCoord`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/box
     *
     * @param {string} field The field.
     * @param {Array<number, number>} bottomLeftCoord The bottom left coordinate (longitude, latitude).
     * @param {Array<number, number>} upperRightCoord The bottom right coordinate (longitude, latitude).
     * @throws {QueryError} `bottomLeftCoord` must be of type `Array<number, number>`.
     * @throws {QueryError} `bottomRightCoord` must be of type `Array<number, number>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!(0, _isArray2.default)(bottomLeftCoord) || !bottomLeftCoord[0] || !bottomLeftCoord[1]) {
        throw new _errors.QueryError('bottomLeftCoord must be a [number, number]');
      }

      if (!(0, _isArray2.default)(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
        throw new _errors.QueryError('upperRightCoord must be a [number, number]');
      }

      bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
      bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
      upperRightCoord[0] = parseFloat(upperRightCoord[0]);
      upperRightCoord[1] = parseFloat(upperRightCoord[1]);

      var coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
      return this.addFilter(field, '$within', { $box: coords });
    }

    /**
     * Adds a within polygon filter to the query. Requires `field` to be a
     * coordinate within the bounds of the polygon defined by `coords`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/polygon
     *
     * @param {string} field The field.
     * @param {Array<Array<number, number>>} coords List of coordinates.
     * @throws {QueryError} `coords` must be of type `Array<Array<number, number>>`.
     * @returns {Query} The query.
     */

  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      if (!(0, _isArray2.default)(coords) || coords.length > 3) {
        throw new _errors.QueryError('coords must be [[number, number]]');
      }

      coords = coords.map(function (coord) {
        if (!coord[0] || !coord[1]) {
          throw new _errors.QueryError('coords argument must be [number, number]');
        }

        return [parseFloat(coord[0]), parseFloat(coord[1])];
      });

      return this.addFilter(field, '$within', { $polygon: coords });
    }

    /**
     * Adds a size filter to the query. Requires `field` to be an `Array` with
     * exactly `size` members.
     * @see https://docs.mongodb.com/manual/reference/operator/query/size
     *
     * @param {string} field Field
     * @param {number} size Size
     * @throws {QueryError} `size` must be of type: `number`.
     * @returns {Query} The query.
     */

  }, {
    key: 'size',
    value: function size(field, _size) {
      if ((0, _isString2.default)(_size)) {
        _size = parseFloat(_size);
      }

      if (!(0, _isNumber2.default)(_size)) {
        throw new _errors.QueryError('size must be a number');
      }

      return this.addFilter(field, '$size', _size);
    }

    /**
     * Adds an ascending sort modifier to the query. Sorts by `field`, ascending.
     *
     * @param {string} field Field
     * @returns {Query} The query.
     */

  }, {
    key: 'ascending',
    value: function ascending(field) {
      if (this._parent) {
        this._parent.ascending(field);
      } else {
        this.sort[field] = 1;
      }

      return this;
    }

    /**
     * Adds an descending sort modifier to the query. Sorts by `field`,
     * descending.
     *
     * @param {string} field Field
     * @returns {Query} The query.
     */

  }, {
    key: 'descending',
    value: function descending(field) {
      if (this._parent) {
        this._parent.descending(field);
      } else {
        this.sort[field] = -1;
      }

      return this;
    }

    /**
     * Adds a filter to the query.
     *
     * @param {string} field Field
     * @param {string} condition Condition
     * @param {*} values Values
     * @returns {Query} The query.
     */

  }, {
    key: 'addFilter',
    value: function addFilter(field, condition, values) {
      if (!(0, _isObject2.default)(this.filter[field])) {
        this.filter[field] = {};
      }

      if (condition && values) {
        this.filter[field][condition] = values;
      } else {
        this.filter[field] = condition;
      }

      return this;
    }

    /**
     * @private
     * Joins the current query with another query using an operator.
     *
     * @param {string} operator Operator
     * @param {Query[]|Object[]} queries Queries
     * @throws {QueryError} `query` must be of type `Query[]` or `Object[]`.
     * @returns {Query} The query.
     */

  }, {
    key: 'join',
    value: function join(operator, queries) {
      var _this2 = this;

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
            throw new _errors.QueryError('query argument must be of type: Kinvey.Query[] or Object[].');
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
        currentQuery[member] = _this2.filter[member];
        delete _this2.filter[member];
      });

      // `currentQuery` is the left-hand side query. Join with `queries`.
      this.filter[operator] = [currentQuery].concat(queries);

      // Return the current query if there are `queries`, and the new (empty)
      // `PrivateQuery` otherwise.
      return that;
    }

    /**
     * @private
     * Processes the data by applying fields, sort, limit, and skip.
     *
     * @param {Array} data The raw data.
     * @throws {QueryError} `data` must be of type `Array`.
     * @returns {Array} The processed data.
     */

  }, {
    key: 'process',
    value: function process(data) {
      var _this3 = this;

      if (this.isSupportedOffline() === false) {
        (function () {
          var message = 'This query is not able to run locally. The following filters are not supported' + ' locally:';

          (0, _forEach2.default)(unsupportedFilters, function (filter) {
            message = message + ' ' + filter;
          });

          throw new _errors.QueryError(message);
        })();
      }

      if (data) {
        var _ret2 = function () {
          // Validate arguments.
          if (!(0, _isArray2.default)(data)) {
            throw new _errors.QueryError('data argument must be of type: Array.');
          }

          // Apply the query
          var json = _this3.toJSON();
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
              var aField = (0, _utils.nested)(a, field);
              var bField = (0, _utils.nested)(b, field);

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

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }

      return data;
    }

    /**
     * Returns Object representation of the query.
     *
     * @returns {Object} Object
     */

  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      if (this._parent) {
        return this._parent.toPlainObject();
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
     * Returns Object representation of the query.
     *
     * @returns {Object} Object
     * @deprecated Use toPlainObject() instead.
     */

  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.toPlainObject();
    }

    /**
     * Returns query string representation of the query.
     *
     * @returns {Object} Query string object.
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

    /**
     * Returns query string representation of the query.
     *
     * @return {string} Query string string.
     */

  }, {
    key: 'toString',
    value: function toString() {
      return JSON.stringify(this.toQueryString());
    }
  }, {
    key: 'fields',
    get: function get() {
      return this._fields;
    }

    /**
     * @type {string[]}
     */
    ,
    set: function set(fields) {
      fields = fields || [];

      if (!(0, _isArray2.default)(fields)) {
        throw new _errors.QueryError('fields must be an Array');
      }

      if (this._parent) {
        this._parent.fields = fields;
      } else {
        this._fields = fields;
      }
    }

    /**
     * @type {Object}
     */

  }, {
    key: 'filter',
    get: function get() {
      return this._filter;
    }

    /**
     * @type {Object}
     */
    ,
    set: function set(filter) {
      this._filter = filter;
    }

    /**
     * @type {Object}
     */

  }, {
    key: 'sort',
    get: function get() {
      return this._sort;
    }

    /**
     * @type {Object}
     */
    ,
    set: function set(sort) {
      if (sort && !(0, _isObject2.default)(sort)) {
        throw new _errors.QueryError('sort must an Object');
      }

      if (this._parent) {
        this._parent.sort(sort);
      } else {
        this._sort = sort || {};
      }
    }

    /**
     * @type {?number}
     */

  }, {
    key: 'limit',
    get: function get() {
      return this._limit;
    }

    /**
     * @type {?number}
     */
    ,
    set: function set(limit) {
      if ((0, _isString2.default)(limit)) {
        limit = parseFloat(limit);
      }

      if (limit && !(0, _isNumber2.default)(limit)) {
        throw new _errors.QueryError('limit must be a number');
      }

      if (this._parent) {
        this._parent.limit = limit;
      } else {
        this._limit = limit;
      }
    }

    /**
     * @type {number}
     */

  }, {
    key: 'skip',
    get: function get() {
      return this._skip;
    }

    /**
     * @type {number}
     */
    ,
    set: function set() {
      var skip = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      if ((0, _isString2.default)(skip)) {
        skip = parseFloat(skip);
      }

      if (!(0, _isNumber2.default)(skip)) {
        throw new _errors.QueryError('skip must be a number');
      }

      if (this._parent) {
        this._parent.skip(skip);
      } else {
        this._skip = skip;
      }
    }
  }]);

  return Query;
}();

exports.Query = Query;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(query) {
    _classCallCheck(this, Query);

    var config = Object.assign({
      fields: [],
      filter: {},
      sort: {},
      limit: Infinity,
      skip: 0
    }, query);

    this.fields = config.fields;
    this.filter = config.filter;
    this.sort = config.sort;
    this.limit = config.limit;
    this.skip = config.skip;
  }

  _createClass(Query, [{
    key: 'equalTo',


    /**
     * Adds an equal to filter to the query. Requires field to equal value.
     * Any existing filters on field will be discarded.
     * @see https://docs.mongodb.com/manual/reference/operator/query/#comparison
     *
     * @param {string} field Field
     * @param {*} value Value
     * @returns {Query} Query
     */
    value: function equalTo(field, value) {
      return this.addFilter(field, value);
    }

    /**
     * Adds a not equal to filter to the query. Requires field not to equal
     * value.
     * @see https://docs.mongodb.com/manual/reference/operator/query/ne
     *
     * @param {string} field Field
     * @param {*} value Value
     * @returns {Query} Query
     */

  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      return this.addFilter(field, '$ne', value);
    }

    /**
     * Adds a contains filter to the query. Requires field to contain at least
     * one of the members of list.
     * @see https://docs.mongodb.com/manual/reference/operator/query/in
     *
     * @param {string} field Field
     * @param {Array} values List of values.
     * @throws {Error} A value is required.
     * @returns {Query} Query
     */

  }, {
    key: 'contains',
    value: function contains(field, values) {
      if (!Array.isArray(values)) {
        throw new Error('Please provide a valid values. Values must be an array.');
      }

      return this.addFilter(field, '$in', values);
    }

    /**
     * Adds a not contained in filter to the query. Requires `field` not to
     * contain any of the members of `list`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/nin
     *
     * @param {string} field Field
     * @param {Array} values List of values.
     * @throws {Error} A value is required.
     * @returns {Query} Query
     */

  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      if (!Array.isArray(values)) {
        throw new Error('Please provide a valid values. Values must be an array.');
      }

      return this.addFilter(field, '$nin', values);
    }

    /**
     * Adds a contains all filter to the query. Requires `field` to contain all
     * members of `list`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/all
     *
     * @param {string} field Field
     * @param {object|Array} values List of values.
     * @throws {Error} A value is required.
     * @returns {Query} Query
     */

  }, {
    key: 'containsAll',
    value: function containsAll(field, values) {
      if (!Array.isArray(values)) {
        throw new Error('Please provide a valid values. Values must be an array.');
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
     * @throws {Error} The value must be a number or string.
     * @returns {Query} Query
     */

  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('The value must be a number or string.');
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
     * @throws {Error} The value must be a number or string.
     * @returns {Query} Query
     */

  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('The value must be a number or string.');
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
     * @throws {Error} The value must be a number or string.
     * @returns {Query} Query
     */

  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('The value must be a number or string.');
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
     * @throws {Error} The value must be a number or string.
     * @returns {Query} Query
     */

  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      if (typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('The value must be a number or string.');
      }

      return this.addFilter(field, '$lte', value);
    }

    /**
     * Adds an exists filter to the query. Requires `field` to exist if `flag` is
     * `true`, or not to exist if `flag` is `false`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/exists
     *
     * @param {string} field Field
     * @param {boolean} [flag=true] The exists flag.
     * @returns {Query} Query
     */

  }, {
    key: 'exists',
    value: function exists(field) {
      var flag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      return this.addFilter(field, '$exists', flag === true);
    }

    /**
     * Adds a modulus filter to the query. Requires `field` modulo `divisor` to
     * have remainder `remainder`.
     * @see https://docs.mongodb.com/manual/reference/operator/query/mod
     *
     * @param {string} field Field
     * @param {number} divisor Divisor
     * @param {number} [remainder=0] Remainder
     * @throws {Error} The divisor must be a number.
     * @throws {Error} The remainder must be a number.
     * @returns {Query} Query
     */

  }, {
    key: 'mod',
    value: function mod(field, divisor) {
      var remainder = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (!(0, _isNumber2.default)(divisor)) {
        throw new Error('Please provide a valid divisor. Divisor must be a number.');
      }

      if (!(0, _isNumber2.default)(remainder)) {
        throw new Error('Please provide a valid remainder. Remainder must be a number.');
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
     * @throws {Error} The regExp must have '^' at the beginning of the expression to make it an anchored expression.
     * @throws {Error} The ignoreCase flag is not supported.
     * @returns {Query} Query
     */

  }, {
    key: 'matches',
    value: function matches(field, expression) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var flags = [];
      var regExp = expression;

      if (!(regExp instanceof RegExp)) {
        regExp = new RegExp(regExp);
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new Error('The regExp must have \'^\' at the beginning of the expression' + ' to make it an anchored expression.');
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new Error('The ignoreCase flag is not supported.');
      }

      if ((regExp.multiline || options.multiline) && options.multiline !== false) {
        flags.push('m');
      }

      if (options.extended === true) {
        flags.push('x');
      }

      if (options.dotMatchesAll === true) {
        flags.push('s');
      }

      if (flags.length > 0) {
        this.addFilter(field, '$options', flags.join(''));
      }

      return this.addFilter(field, '$regex', regExp.source);
    }

    /**
     * Adds a near filter to the query. Requires `field` to be a coordinate
     * within `maxDistance` of `coord`. Sorts documents from nearest to farthest.
     * @see https://docs.mongodb.com/manual/reference/operator/query/near
     *
     * @param {string} field The field.
     * @param {Array<number, number>} coord The coordinate (longitude, latitude).
     * @param {number} [maxDistance] The maximum distance (miles).
     * @throws {Error} The coord must be a [number, number].
     * @returns {Query} Query
     */

  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      if (!Array.isArray(coord) || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
        throw new Error('The coord must be a [number, number].');
      }

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if (typeof maxDistance === 'number') {
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
     * @throws {Error} The bottomLeftCoord must be a [number, number].
     * @throws {Error} The upperRightCoord must be a [number, number].
     * @returns {Query} Query
     */

  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!Array.isArray(bottomLeftCoord) || typeof bottomLeftCoord[0] !== 'number' || typeof bottomLeftCoord[1] !== 'number') {
        throw new Error('The bottomLeftCoord must be a [number, number].');
      }

      if (!Array.isArray(upperRightCoord) || typeof upperRightCoord[0] !== 'number' || typeof upperRightCoord[1] !== 'number') {
        throw new Error('The upperRightCoord must be a [number, number].');
      }

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
     * @throws {Error} The coords must be a [[number, number]].
     * @returns {Query} Query
     */

  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      if (Array.isArray(coords) === false || coords.length === 0 || coords[0].length > 3) {
        throw new Error('The coords must be a [[number, number]].');
      }

      var withinCoords = coords.map(function (coord) {
        if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          throw new Error('The coords must be a [[number, number]].');
        }

        return [coord[0], coord[1]];
      });

      return this.addFilter(field, '$within', { $polygon: withinCoords });
    }

    /**
     * Adds a size filter to the query. Requires `field` to be an `Array` with
     * exactly `size` members.
     * @see https://docs.mongodb.com/manual/reference/operator/query/size
     *
     * @param {string} field Field
     * @param {number} size Size
     * @throws {Error} The size must be a number.
     * @returns {Query} Query
     */

  }, {
    key: 'size',
    value: function size(field, _size) {
      if (typeof _size !== 'number') {
        throw new Error('The size must be a number.');
      }

      return this.addFilter(field, '$size', _size);
    }

    /**
     * Adds an ascending sort modifier to the query. Sorts by `field`, ascending.
     *
     * @param {string} field Field
     * @returns {Query} Query
     */

  }, {
    key: 'ascending',
    value: function ascending(field) {
      if (this.parent) {
        this.parent.ascending(field);
      } else {
        if (!this.sort) {
          this.sort = {};
        }

        this.sort[field] = 1;
      }

      return this;
    }

    /**
     * Adds an descending sort modifier to the query. Sorts by `field`,
     * descending.
     *
     * @param {string} field Field
     * @returns {Query} Query
     */

  }, {
    key: 'descending',
    value: function descending(field) {
      if (this.parent) {
        this.parent.descending(field);
      } else {
        if (!this.sort) {
          this.sort = {};
        }

        this.sort[field] = -1;
      }

      return this;
    }

    /**
     * Performs a logical AND operation on the query and the provided queries.
     * @see https://docs.mongodb.com/manual/reference/operator/query/and
     *
     * @param {...Query|...Object} args Queries
     * @throws {Error} Queries must be an array of Query instances or objects.
     * @returns {Query} Query
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
     * @throws {Error} Queries must be an array of Query instances or objects.
     * @returns {Query} Query
     */

  }, {
    key: 'nor',
    value: function nor() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
      // apply the NOR onto the parent to make sure AND indeed precedes NOR.
      if (this.parent && Object.hasOwnProperty.call(this.parent.filter, '$and')) {
        var _parent;

        return (_parent = this.parent).nor.apply(_parent, args);
      }

      return this.join('$nor', args);
    }

    /**
     * Performs a logical OR operation on the query and the provided queries.
     * @see https://docs.mongodb.com/manual/reference/operator/query/or
     *
     * @param {...Query|...Object} args Queries.
     * @throws {Error} Queries must be an array of Query instances or objects.
     * @returns {Query} Query
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
      if (this.parent) {
        var _parent2;

        return (_parent2 = this.parent).or.apply(_parent2, args);
      }

      return this.join('$or', args);
    }

    /**
     * Returns query string representation of the query as a JavaScript object.
     *
     * @returns {Object} Query string object.
     */

  }, {
    key: 'toQueryObject',
    value: function toQueryObject() {
      var queryObject = {};

      if (Object.keys(this.filter).length > 0) {
        queryObject.query = this.filter;
      }

      if (this.fields.length > 0) {
        queryObject.fields = this.fields.join(',');
      }

      if (typeof this.limit === 'number' && this.limit < Infinity) {
        queryObject.limit = this.limit;
      }

      if (typeof this.skip === 'number' && this.skip > 0) {
        queryObject.skip = this.skip;
      }

      if (this.sort && Object.keys(this.sort).length > 0) {
        queryObject.sort = this.sort;
      }

      var keys = Object.keys(queryObject);
      keys.forEach(function (key) {
        queryObject[key] = typeof queryObject[key] === 'string' ? queryObject[key] : JSON.stringify(queryObject[key]);
      });

      return queryObject;
    }

    /**
     * @deprecated
     * Please use Query.prototype.toQueryObject() instead.
     */

  }, {
    key: 'toQueryString',
    value: function toQueryString() {
      return this.toQueryObject();
    }

    /**
     * @private
     * Adds a filter to the query.
     *
     * @param {string} field Field
     * @param {string} condition Condition
     * @param {*} values Values
     * @returns {Query} Query
     */

  }, {
    key: 'addFilter',
    value: function addFilter(field) {
      var _ref = (arguments.length <= 1 ? 0 : arguments.length - 1) === 2 ? { condition: arguments.length <= 1 ? undefined : arguments[1], values: arguments.length <= 2 ? undefined : arguments[2] } : { condition: undefined, values: arguments.length <= 1 ? undefined : arguments[1] },
          condition = _ref.condition,
          values = _ref.values;

      if (!this.filter) {
        this.filter = {};
      }

      if (condition) {
        if (!this.filter[field]) {
          this.filter[field] = {};
        }

        this.filter[field][condition] = values;
      } else {
        this.filter[field] = values;
      }

      return this;
    }

    /**
     * @private
     * Joins the current query with another query using an operator.
     *
     * @param {string} operator Operator
     * @param {Query[]|object[]} queries Queries
     * @throws {Error} Queries must be an array of Query instances or objects.
     * @returns {Query} Query
     */

  }, {
    key: 'join',
    value: function join(operator, queries) {
      var _this = this;

      var that = this;
      var filters = queries.map(function (query) {
        return query.filter;
      });

      if (filters.length === 0) {
        that = new Query();
        filters = [that.filter];
        that.parent = this; // Required for operator precedence
      }

      var currentFilter = Object.keys(this.filter).reduce(function (filter, key) {
        // eslint-disable-next-line no-param-reassign
        filter[key] = _this.filter[key];
        delete _this.filter[key];
        return filter;
      }, {});

      this.addFilter(operator, [currentFilter].concat(filters));
      return that;
    }
  }, {
    key: 'fields',
    get: function get() {
      return this._fields;
    },
    set: function set(fields) {
      if (!Array.isArray(fields)) {
        throw new Error('Please provide a valid fields. Fields must be an array or strings.');
      }

      if (this.parent) {
        this.parent.fields = fields;
      } else {
        this._fields = fields;
      }
    }
  }, {
    key: 'sort',
    get: function get() {
      return this._sort;
    },
    set: function set(sort) {
      if (sort && !(0, _isPlainObject2.default)(sort)) {
        throw new Error('Please provide a valid sort. Sort must be an plain object.');
      }

      if (this.parent) {
        this.parent.sort = sort;
      } else {
        this._sort = sort;
      }
    }
  }, {
    key: 'limit',
    get: function get() {
      return this._limit;
    },
    set: function set(limit) {
      if (!(0, _isNumber2.default)(limit)) {
        throw new Error('Please provide a valid limit. Limit must be a number.');
      }

      if (this.parent) {
        this.parent.limit = limit;
      } else {
        this._limit = limit;
      }
    }
  }, {
    key: 'skip',
    get: function get() {
      return this._skip;
    },
    set: function set(skip) {
      if (!(0, _isNumber2.default)(skip)) {
        throw new Error('Please provide a valid skip. Skip must be a number.');
      }

      if (this.parent) {
        this.parent.skip = skip;
      } else {
        this._skip = skip;
      }
    }
  }]);

  return Query;
}();

exports.default = Query;
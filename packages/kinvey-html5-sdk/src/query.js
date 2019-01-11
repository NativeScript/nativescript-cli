"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _isObject = _interopRequireDefault(require("lodash/isObject"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _sift = _interopRequireDefault(require("sift"));

var _query = _interopRequireDefault(require("./errors/query"));

var UNSUPPORTED_CONDITIONS = ['$nearSphere'];
var PROTECTED_FIELDS = ['_id', '_acl'];

function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    return value || obj;
  }

  var parts = dotProperty.split('.');
  var currentProperty = parts.shift();
  var currentObj = obj;

  while (currentProperty && typeof currentObj !== 'undefined') {
    currentObj = currentObj[currentProperty];
    currentProperty = parts.shift();
  }

  return typeof currentObj === 'undefined' ? value : currentObj;
}

var Query =
/*#__PURE__*/
function () {
  function Query(query) {
    (0, _classCallCheck2.default)(this, Query);
    var config = Object.assign({}, {
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

  (0, _createClass2.default)(Query, [{
    key: "isSupportedOffline",

    /**
     * Returns true or false depending on if the query is able to be processed offline.
     *
     * @returns {boolean} True if the query is supported offline otherwise false.
     */
    value: function isSupportedOffline() {
      var _this = this;

      return Object.keys(this.filter).reduce(function (supported, key) {
        if (supported) {
          var value = _this.filter[key];
          return UNSUPPORTED_CONDITIONS.some(function (unsupportedConditions) {
            if (!value) {
              return true;
            }

            if (!(0, _isObject.default)(value)) {
              return true;
            }

            return !Object.keys(value).some(function (condition) {
              return condition === unsupportedConditions;
            });
          });
        }

        return supported;
      }, true);
    }
    /**
     * Adds an equal to filter to the query. Requires field to equal value.
     * Any existing filters on field will be discarded.
     * @see https://docs.mongodb.com/manual/reference/operator/query/#comparison
     *
     * @param {string} field Field
     * @param {*} value Value
     * @returns {Query} Query
     */

  }, {
    key: "equalTo",
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
    key: "notEqualTo",
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
    key: "contains",
    value: function contains(field, values) {
      if (!values) {
        throw new _query.default('You must supply a value.');
      }

      if (!Array.isArray(values)) {
        return this.addFilter(field, '$in', [values]);
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
    key: "notContainedIn",
    value: function notContainedIn(field, values) {
      if (!values) {
        throw new _query.default('You must supply a value.');
      }

      if (!Array.isArray(values)) {
        return this.addFilter(field, '$nin', [values]);
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
    key: "containsAll",
    value: function containsAll(field, values) {
      if (!values) {
        throw new _query.default('You must supply a value.');
      }

      if (!Array.isArray(values)) {
        return this.addFilter(field, '$all', [values]);
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
    key: "greaterThan",
    value: function greaterThan(field, value) {
      if (!(0, _isNumber.default)(value) && !(0, _isString.default)(value)) {
        throw new _query.default('You must supply a number or string.');
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
    key: "greaterThanOrEqualTo",
    value: function greaterThanOrEqualTo(field, value) {
      if (!(0, _isNumber.default)(value) && !(0, _isString.default)(value)) {
        throw new _query.default('You must supply a number or string.');
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
    key: "lessThan",
    value: function lessThan(field, value) {
      if (!(0, _isNumber.default)(value) && !(0, _isString.default)(value)) {
        throw new _query.default('You must supply a number or string.');
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
    key: "lessThanOrEqualTo",
    value: function lessThanOrEqualTo(field, value) {
      if (!(0, _isNumber.default)(value) && !(0, _isString.default)(value)) {
        throw new _query.default('You must supply a number or string.');
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
    key: "exists",
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
    key: "mod",
    value: function mod(field, divisor) {
      var remainder = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (!(0, _isNumber.default)(divisor)) {
        throw new _query.default('divisor must be a number');
      }

      if (!(0, _isNumber.default)(remainder)) {
        throw new _query.default('remainder must be a number');
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
    key: "matches",
    value: function matches(field, expression) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var flags = [];
      var regExp = expression;

      if (!(regExp instanceof RegExp)) {
        regExp = new RegExp(regExp);
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new _query.default('regExp must have \'^\' at the beginning of the expression to make it an anchored expression.');
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new _query.default('ignoreCase flag is not supported');
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
    key: "near",
    value: function near(field, coord, maxDistance) {
      if (!Array.isArray(coord) || !(0, _isNumber.default)(coord[0]) || !(0, _isNumber.default)(coord[1])) {
        throw new _query.default('coord must be a [number, number]');
      }

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if ((0, _isNumber.default)(maxDistance)) {
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
    key: "withinBox",
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!Array.isArray(bottomLeftCoord) || !(0, _isNumber.default)(bottomLeftCoord[0]) || !(0, _isNumber.default)(bottomLeftCoord[1])) {
        throw new _query.default('bottomLeftCoord must be a [number, number]');
      }

      if (!Array.isArray(upperRightCoord) || !(0, _isNumber.default)(upperRightCoord[0]) || !(0, _isNumber.default)(upperRightCoord[1])) {
        throw new _query.default('upperRightCoord must be a [number, number]');
      }

      var coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
      return this.addFilter(field, '$within', {
        $box: coords
      });
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
    key: "withinPolygon",
    value: function withinPolygon(field, coords) {
      if (Array.isArray(coords) === false || coords.length === 0 || coords[0].length > 3) {
        throw new _query.default('coords must be a [[number, number]]');
      }

      var withinCoords = coords.map(function (coord) {
        if (!(0, _isNumber.default)(coord[0]) || !(0, _isNumber.default)(coord[1])) {
          throw new _query.default('coords argument must be a [number, number]');
        }

        return [coord[0], coord[1]];
      });
      return this.addFilter(field, '$within', {
        $polygon: withinCoords
      });
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
    key: "size",
    value: function size(field, _size) {
      if (!(0, _isNumber.default)(_size)) {
        throw new _query.default('size must be a number');
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
    key: "ascending",
    value: function ascending(field) {
      if (this._parent) {
        this._parent.ascending(field);
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
    key: "descending",
    value: function descending(field) {
      if (this._parent) {
        this._parent.descending(field);
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
    key: "and",
    value: function and() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
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
    key: "nor",
    value: function nor() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
      // apply the NOR onto the parent to make sure AND indeed precedes NOR.
      if (this._parent && Object.hasOwnProperty.call(this._parent.filter, '$and')) {
        var _this$_parent;

        return (_this$_parent = this._parent).nor.apply(_this$_parent, args);
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
    key: "or",
    value: function or() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      // OR has lowest precedence. Therefore, if this query is part of any join,
      // apply the OR onto the parent to make sure OR has indeed the lowest
      // precedence.
      if (this._parent) {
        var _this$_parent2;

        return (_this$_parent2 = this._parent).or.apply(_this$_parent2, args);
      }

      return this.join('$or', args);
    }
    /**
     * Returns query string representation of the query as a JavaScript object.
     *
     * @returns {Object} Query string object.
     */

  }, {
    key: "toQueryObject",
    value: function toQueryObject() {
      var queryObject = {};

      if (Object.keys(this.filter).length > 0) {
        queryObject.query = this.filter;
      }

      if (this.fields.length > 0) {
        queryObject.fields = this.fields.join(',');
      }

      if ((0, _isNumber.default)(this.limit) && this.limit < Infinity) {
        queryObject.limit = this.limit;
      }

      if ((0, _isNumber.default)(this.skip) && this.skip > 0) {
        queryObject.skip = this.skip;
      }

      if (this.sort && Object.keys(this.sort).length > 0) {
        queryObject.sort = this.sort;
      }

      var keys = Object.keys(queryObject);
      keys.forEach(function (key) {
        queryObject[key] = (0, _isString.default)(queryObject[key]) ? queryObject[key] : JSON.stringify(queryObject[key]);
      });
      return queryObject;
    }
    /**
     * @deprecated
     * Please use Query.prototype.toQueryObject() instead.
     */

  }, {
    key: "toQueryString",
    value: function toQueryString() {
      return this.toQueryObject();
    }
    /**
     * Returns Object representation of the query.
     *
     * @returns {Object} Object
     */

  }, {
    key: "toPlainObject",
    value: function toPlainObject() {
      if (this._parent) {
        return this._parent.toPlainObject();
      } // Return set of parameters.


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
     * Returns query string representation of the query.
     *
     * @return {string} Query string string.
     */

  }, {
    key: "toString",
    value: function toString() {
      return JSON.stringify(this.toQueryString());
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
    key: "addFilter",
    value: function addFilter(field) {
      var _ref = (arguments.length <= 1 ? 0 : arguments.length - 1) === 2 ? {
        condition: arguments.length <= 1 ? undefined : arguments[1],
        values: arguments.length <= 2 ? undefined : arguments[2]
      } : {
        condition: undefined,
        values: arguments.length <= 1 ? undefined : arguments[1]
      },
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
    key: "join",
    value: function join(operator, queries) {
      var _this2 = this;

      var that = this;
      var filters = queries.map(function (query) {
        return query.filter;
      });

      if (filters.length === 0) {
        that = new Query();
        filters = [that.filter];
        that._parent = this; // Required for operator precedence
      }

      var currentFilter = Object.keys(this.filter).reduce(function (filter, key) {
        // eslint-disable-next-line no-param-reassign
        filter[key] = _this2.filter[key];
        delete _this2.filter[key];
        return filter;
      }, {});
      this.addFilter(operator, [currentFilter].concat(filters));
      return that;
    }
  }, {
    key: "process",
    value: function process() {
      var _this3 = this;

      var docs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (!Array.isArray(docs)) {
        throw new Error('data argument must be of type: Array.');
      }

      if (!this.isSupportedOffline()) {
        throw new Error('This query is not able to run locally.');
      }

      if (docs.length > 0) {
        var processedDocs;

        if (this.filter && !(0, _isEmpty.default)(this.filter)) {
          processedDocs = (0, _sift.default)(this.filter, docs);
        } else {
          processedDocs = docs;
        }

        if (!(0, _isEmpty.default)(this.sort)) {
          // eslint-disable-next-line arrow-body-style
          processedDocs.sort(function (a, b) {
            return Object.keys(_this3.sort).reduce(function (result, field) {
              if (typeof result !== 'undefined') {
                return result;
              }

              if (Object.prototype.hasOwnProperty.call(_this3.sort, field)) {
                var aField = nested(a, field);
                var bField = nested(b, field);
                var modifier = _this3.sort[field]; // -1 (descending) or 1 (ascending)

                if (aField !== null && typeof aField !== 'undefined' && (bField === null || typeof bField === 'undefined')) {
                  return 1 * modifier;
                } else if (bField !== null && typeof bField !== 'undefined' && (aField === null || typeof aField === 'undefined')) {
                  return -1 * modifier;
                } else if (typeof aField === 'undefined' && bField === null) {
                  return 0;
                } else if (aField === null && typeof bField === 'undefined') {
                  return 0;
                } else if (aField !== bField) {
                  return (aField < bField ? -1 : 1) * modifier;
                }
              }

              return 0;
            }, undefined);
          });
        }

        if (this.skip > 0) {
          if (this.limit < Infinity) {
            processedDocs = processedDocs.slice(this.skip, this.skip + this.limit);
          } else {
            processedDocs = processedDocs.slice(this.skip);
          }
        } else if (this.limit < Infinity) {
          processedDocs = processedDocs.slice(0, this.limit);
        }

        if ((0, _isArray.default)(this.fields) && this.fields.length > 0) {
          processedDocs = processedDocs.map(function (doc) {
            var modifiedDoc = doc;
            Object.keys(modifiedDoc).forEach(function (key) {
              if (_this3.fields.indexOf(key) === -1 && PROTECTED_FIELDS.indexOf(key) === -1) {
                delete modifiedDoc[key];
              }
            });
            return modifiedDoc;
          });
        }

        return processedDocs;
      }

      return docs;
    }
  }, {
    key: "fields",
    get: function get() {
      return this._fields;
    },
    set: function set(fields) {
      if (!Array.isArray(fields)) {
        throw new _query.default('fields must be an Array');
      }

      if (this._parent) {
        this._parent.fields = fields;
      } else {
        this._fields = fields;
      }
    }
  }, {
    key: "sort",
    get: function get() {
      return this._sort;
    },
    set: function set(sort) {
      if (sort && !(0, _isPlainObject.default)(sort)) {
        throw new _query.default('sort must an Object');
      }

      if (this._parent) {
        this._parent.sort = sort;
      } else {
        this._sort = sort;
      }
    }
  }, {
    key: "limit",
    get: function get() {
      return this._limit;
    },
    set: function set(limit) {
      var _limit = limit;

      if ((0, _isString.default)(_limit)) {
        _limit = parseFloat(_limit);
      }

      if (limit && !(0, _isNumber.default)(_limit)) {
        throw new _query.default('limit must be a number');
      }

      if (this._parent) {
        this._parent.limit = _limit;
      } else {
        this._limit = _limit;
      }
    }
  }, {
    key: "skip",
    get: function get() {
      return this._skip;
    },
    set: function set(skip) {
      var _skip = skip;

      if ((0, _isString.default)(_skip)) {
        _skip = parseFloat(_skip);
      }

      if (!(0, _isNumber.default)(_skip)) {
        throw new _query.default('skip must be a number');
      }

      if (this._parent) {
        this._parent.skip = _skip;
      } else {
        this._skip = _skip;
      }
    }
  }]);
  return Query;
}();

exports.default = Query;
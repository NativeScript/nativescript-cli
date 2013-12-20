/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Querying.
// ---------

// The `Kinvey.Query` class provides an easy way to build queries, which can
// then be passed to one of the REST API wrappers to query application data.
// Internally, the class builds a MongoDB query.

/**
 * The Kinvey.Query class.
 *
 * @memberof! <global>
 * @class Kinvey.Query
 * @param {Object} [options] Options.
 * @param {Object} [options.filter] Filter.
 * @param {Object} [options.sort] Sort.
 * @param {number} [options.skip] Skip.
 * @param {number} [options.limit] Limit.
 */
Kinvey.Query = function(options) {
  // Cast arguments.
  options = options || {};

  /**
   * The MongoDB query.
   *
   * @private
   * @type {Object}
   */
  this._filter = options.filter || {};

  /**
   * The sorting order.
   *
   * @private
   * @type {Object}
   */
  this._sort = options.sort || {};

  /**
   * Number of documents to select.
   *
   * @private
   * @type {?number}
   */
  this._limit = options.limit || null;

  /**
   * Number of documents to skip from the start.
   *
   * @private
   * @type {number}
   */
  this._skip = options.skip || 0;

  /**
   * Maintain reference to the parent query in case the query is part of a
   * join.n
   *
   * @private
   * @type {?Kinvey.Query}
   */
  this._parent = null;
};

// Define the query methods.
Kinvey.Query.prototype = /** @lends Kinvey.Query# */{
  // Comparison.

  /**
   * Adds an equal to filter to the query. Requires `field` to equal `value`.
   * Any existing filters on `field` will be discarded.
   * http://docs.mongodb.org/manual/reference/operators/#comparison
   *
   * @param {string} field Field.
   * @param {*} value Value.
   * @returns {Kinvey.Query} The query.
   */
  equalTo: function(field, value) {
    this._filter[field] = value;
    return this;
  },

  /**
   * Adds a contains filter to the query. Requires `field` to contain at least
   * one of the members of `list`.
   * http://docs.mongodb.org/manual/reference/operator/in/
   *
   * @param {string} field Field.
   * @param {Array} values List of values.
   * @throws {Kinvey.Error} `values` must be of type: `Array`.
   * @returns {Kinvey.Query} The query.
   */
  contains: function(field, values) {
    // Validate arguments.
    if(!isArray(values)) {
      throw new Kinvey.Error('values argument must be of type: Array.');
    }

    return this._addFilter(field, '$in', values);
  },

  /**
   * Adds a contains all filter to the query. Requires `field` to contain all
   * members of `list`.
   * http://docs.mongodb.org/manual/reference/operator/all/
   *
   * @param {string} field Field.
   * @param {Array} values List of values.
   * @throws {Kinvey.Error} `values` must be of type: `Array`.
   * @returns {Kinvey.Query} The query.
   */
  containsAll: function(field, values) {
    // Validate arguments.
    if(!isArray(values)) {
      throw new Kinvey.Error('values argument must be of type: Array.');
    }

    return this._addFilter(field, '$all', values);
  },

  /**
   * Adds a greater than filter to the query. Requires `field` to be greater
   * than `value`.
   * http://docs.mongodb.org/manual/reference/operator/gt/
   *
   * @param {string} field Field.
   * @param {number|string} value Value.
   * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
   * @returns {Kinvey.Query} The query.
   */
  greaterThan: function(field, value) {
    // Validate arguments.
    if(!(isNumber(value) || isString(value))) {
      throw new Kinvey.Error('value argument must be of type: number or string.');
    }

    return this._addFilter(field, '$gt', value);
  },

  /**
   * Adds a greater than or equal to filter to the query. Requires `field` to
   * be greater than or equal to `value`.
   * http://docs.mongodb.org/manual/reference/operator/gte/
   *
   * @param {string} field Field.
   * @param {number|string} value Value.
   * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
   * @returns {Kinvey.Query} The query.
   */
  greaterThanOrEqualTo: function(field, value) {
    // Validate arguments.
    if(!(isNumber(value) || isString(value))) {
      throw new Kinvey.Error('value argument must be of type: number or string.');
    }

    return this._addFilter(field, '$gte', value);
  },

  /**
   * Adds a less than filter to the query. Requires `field` to be less than
   * `value`.
   * http://docs.mongodb.org/manual/reference/operator/lt/
   *
   * @param {string} field Field.
   * @param {number|string} value Value.
   * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
   * @returns {Kinvey.Query} The query.
   */
  lessThan: function(field, value) {
    // Validate arguments.
    if(!(isNumber(value) || isString(value))) {
      throw new Kinvey.Error('value argument must be of type: number or string.');
    }

    return this._addFilter(field, '$lt', value);
  },

  /**
   * Adds a less than or equal to filter to the query. Requires `field` to be
   * less than or equal to `value`.
   * http://docs.mongodb.org/manual/reference/operator/lte/
   *
   * @param {string} field Field.
   * @param {number|string} value Value.
   * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
   * @returns {Kinvey.Query} The query.
   */
  lessThanOrEqualTo: function(field, value) {
    // Validate arguments.
    if(!(isNumber(value) || isString(value))) {
      throw new Kinvey.Error('value argument must be of type: number or string.');
    }

    return this._addFilter(field, '$lte', value);
  },

  /**
   * Adds a not equal to filter to the query. Requires `field` not to equal
   * `value`.
   * http://docs.mongodb.org/manual/reference/operator/ne/
   *
   * @param {string} field Field.
   * @param {*} value Value.
   * @returns {Kinvey.Query} The query.
   */
  notEqualTo: function(field, value) {
    return this._addFilter(field, '$ne', value);
  },

  /**
   * Adds a not contained in filter to the query. Requires `field` not to
   * contain any of the members of `list`.
   * http://docs.mongodb.org/manual/reference/operator/nin/
   *
   * @param {string} field Field.
   * @param {Array} values List of values.
   * @throws {Kinvey.Error} `values` must be of type: `Array`.
   * @returns {Kinvey.Query} The query.
   */
  notContainedIn: function(field, values) {
    // Validate arguments.
    if(!isArray(values)) {
      throw new Kinvey.Error('values argument must be of type: Array.');
    }

    return this._addFilter(field, '$nin', values);
  },

  // Logical. The operator precedence is as defined as: AND-NOR-OR.

  /**
   * Performs a logical AND operation on the query and the provided queries.
   * http://docs.mongodb.org/manual/reference/operator/and/
   *
   * @param {...Kinvey.Query|Object} Queries.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
   * @returns {Kinvey.Query} The query.
   */
  and: function() {
    // AND has highest precedence. Therefore, even if this query is part of a
    // JOIN already, apply it on this query.
    return this._join('$and', Array.prototype.slice.call(arguments));
  },

  /**
   * Performs a logical NOR operation on the query and the provided queries.
   * http://docs.mongodb.org/manual/reference/operator/nor/
   *
   * @param {...Kinvey.Query|Object} Queries.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
   * @returns {Kinvey.Query} The query.
   */
  nor: function() {
    // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
    // apply the NOR onto the parent to make sure AND indeed precedes NOR.
    if(null !== this._parent && null != this._parent._filter.$and) {
      return this._parent.nor.apply(this._parent, arguments);
    }
    return this._join('$nor', Array.prototype.slice.call(arguments));
  },

  /**
   * Performs a logical OR operation on the query and the provided queries.
   * http://docs.mongodb.org/manual/reference/operator/or/
   *
   * @param {...Kinvey.Query|Object} Queries.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
   * @returns {Kinvey.Query} The query.
   */
  or: function() {
    // OR has lowest precedence. Therefore, if this query is part of any join,
    // apply the OR onto the parent to make sure OR has indeed the lowest
    // precedence.
    if(null !== this._parent) {
      return this._parent.or.apply(this._parent, arguments);
    }
    return this._join('$or', Array.prototype.slice.call(arguments));
  },

  // Element.

  /**
   * Adds an exists filter to the query. Requires `field` to exist if `flag` is
   * `true`, or not to exist if `flag` is `false`.
   * http://docs.mongodb.org/manual/reference/operator/exists/
   *
   * @param {string} field Field.
   * @param {boolean} [flag=true] The exists flag.
   * @returns {Kinvey.Query} The query.
   */
  exists: function(field, flag) {
    flag = 'undefined' === typeof flag ? true : flag || false;// Cast.
    return this._addFilter(field, '$exists', flag);
  },

  /**
   * Adds a modulus filter to the query. Requires `field` modulo `divisor` to
   * have remainder `remainder`.
   * http://docs.mongodb.org/manual/reference/operator/mod/
   *
   * @param {string} field Field.
   * @param {number} divisor Divisor.
   * @param {number} [remainder=0] Remainder.
   * @throws {Kinvey.Error} * `divisor` must be of type: `number`.
   *                         * `remainder` must be of type: `number`.
   * @returns {Kinvey.Query} The query.
   */
  mod: function(field, divisor, remainder) {
    // Cast arguments.
    if(isString(divisor)) {
      divisor = parseFloat(divisor);
    }
    if('undefined' === typeof remainder) {
      remainder = 0;
    }
    else if(isString(remainder)) {
      remainder = parseFloat(remainder);
    }

    // Validate arguments.
    if(!isNumber(divisor)) {
      throw new Kinvey.Error('divisor arguments must be of type: number.');
    }
    if(!isNumber(remainder)) {
      throw new Kinvey.Error('remainder argument must be of type: number.');
    }

    return this._addFilter(field, '$mod', [ divisor, remainder ]);
  },

  // JavaScript.

  /**
   * Adds a match filter to the query. Requires `field` to match `regExp`.
   * http://docs.mongodb.org/manual/reference/operator/regex/
   *
   * @param {string} field Field.
   * @param {RegExp|string} regExp Regular expression.
   * @param {Object} [options] Options.
   * @param {boolean} [options.ignoreCase=inherit] Toggles case-insensitivity.
   * @param {boolean} [options.multiline=inherit] Toggles multiline matching.
   * @param {boolean} [options.extended=false] Toggles extended capability.
   * @param {boolean} [options.dotMatchesAll=false] Toggles dot matches all.
   * @returns {Kinvey.Query} The query.
   */
  matches: function(field, regExp, options) {
    // Cast arguments.
    if(!isRegExp(regExp)) {
      regExp = new RegExp(regExp);
    }
    options = options || {};

    // Validate arguments.
    if((regExp.ignoreCase || options.ignoreCase) && false !== options.ignoreCase) {
      throw new Error('ignoreCase flag is not supported.');
    }
    if(0 !== regExp.source.indexOf('^')) {
      throw new Error('regExp must be an anchored expression.');
    }

    // Flags.
    var flags = [];
    if((regExp.multiline || options.multiline) && false !== options.multiline) {
      flags.push('m');
    }
    if(options.extended) {
      flags.push('x');
    }
    if(options.dotMatchesAll) {
      flags.push('s');
    }

    // `$regex` and `$options` are separate filters.
    var result = this._addFilter(field, '$regex', regExp.source);
    if(0 !== flags.length) {
      this._addFilter(field, '$options', flags.join(''));
    }
    return result;
  },

  // Geospatial.

  /**
   * Adds a near filter to the query. Requires `field` to be a coordinate
   * within `maxDistance` of `coord`. Sorts documents from nearest to farthest.
   * http://docs.mongodb.org/manual/reference/operator/near/
   *
   * @param {string} field The field.
   * @param {Array.<number, number>} coord The coordinate (longitude, latitude).
   * @param {number} [maxDistance] The maximum distance (miles).
   * @throws {Kinvey.Error} `coord` must be of type: `Array.<number, number>`.
   * @returns {Kinvey.Query} The query.
   */
  near: function(field, coord, maxDistance) {
    // Validate arguments.
    if(!isArray(coord) || null == coord[0] || null == coord[1]) {
      throw new Kinvey.Error('coord argument must be of type: Array.<number, number>.');
    }

    // Cast arguments.
    coord[0] = parseFloat(coord[0]);
    coord[1] = parseFloat(coord[1]);

    // `$nearSphere` and `$maxDistance` are separate filters.
    var result = this._addFilter(field, '$nearSphere', [ coord[0], coord[1] ]);
    if(null != maxDistance) {
      this._addFilter(field, '$maxDistance', maxDistance);
    }
    return result;
  },

  /**
   * Adds a within box filter to the query. Requires `field` to be a coordinate
   * within the bounds of the rectangle defined by `bottomLeftCoord`,
   * `bottomRightCoord`.
   * http://docs.mongodb.org/manual/reference/operator/box/
   *
   * @param {string} field The field.
   * @param {Array.<number, number>} bottomLeftCoord The bottom left coordinate
   *          (longitude, latitude).
   * @param {Array.<number, number>} upperRightCoord The bottom right
   *          coordinate (longitude, latitude).
   * @throws {Kinvey.Error} * `bottomLeftCoord` must be of type: `Array.<number, number>`.
   *                         * `bottomRightCoord` must be of type: `Array.<number, number>`.
   * @returns {Kinvey.Query} The query.
   */
  withinBox: function(field, bottomLeftCoord, upperRightCoord) {
    // Validate arguments.
    if(!isArray(bottomLeftCoord) || null == bottomLeftCoord[0] || null == bottomLeftCoord[1]) {
      throw new Kinvey.Error('bottomLeftCoord argument must be of type: Array.<number, number>.');
    }
    if(!isArray(upperRightCoord) || null == upperRightCoord[0] || null == upperRightCoord[1]) {
      throw new Kinvey.Error('upperRightCoord argument must be of type: Array.<number, number>.');
    }

    // Cast arguments.
    bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
    bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
    upperRightCoord[0] = parseFloat(upperRightCoord[0]);
    upperRightCoord[1] = parseFloat(upperRightCoord[1]);

    var coords = [
      [ bottomLeftCoord[0], bottomLeftCoord[1] ],
      [ upperRightCoord[0], upperRightCoord[1] ]
    ];
    return this._addFilter(field, '$within', { $box: coords });
  },

  /**
   * Adds a within polygon filter to the query. Requires `field` to be a
   * coordinate within the bounds of the polygon defined by `coords`.
   * http://docs.mongodb.org/manual/reference/operator/polygon/
   *
   * @param {string} field The field.
   * @param {Array.Array.<number, number>} coords List of coordinates.
   * @throws {Kinvey.Error} `coords` must be of type `Array.Array.<number, number>`.
   * @returns {Kinvey.Query} The query.
   */
  withinPolygon: function(field, coords) {
    // Validate arguments.
    if(!isArray(coords) || 3 > coords.length) {
      throw new Kinvey.Error('coords argument must be of type: Array.Array.<number, number>.');
    }

    // Cast and validate arguments.
    coords = coords.map(function(coord) {
      if(null == coord[0] || null == coord[1]) {
        throw new Kinvey.Error('coords argument must be of type: Array.Array.<number, number>.');
      }
      return [ parseFloat(coord[0]), parseFloat(coord[1]) ];
    });

    return this._addFilter(field, '$within', { $polygon: coords });
  },

  // Array.

  /**
   * Adds a size filter to the query. Requires `field` to be an `Array` with
   * exactly `size` members.
   * http://docs.mongodb.org/manual/reference/operator/size/
   *
   * @param {string} field Field.
   * @param {number} size Size.
   * @throws {Kinvey.Error} `size` must be of type: `number`.
   * @returns {Kinvey.Query} The query.
   */
  size: function(field, size) {
    // Cast arguments.
    if(isString(size)) {
      size = parseFloat(size);
    }

    // Validate arguments.
    if(!isNumber(size)) {
      throw new Kinvey.Error('size argument must be of type: number.');
    }

    return this._addFilter(field, '$size', size);
  },

  // Modifiers.

  /**
   * Sets the number of documents to select.
   *
   * @param {number} [limit] Limit.
   * @throws {Kinvey.Error} `limit` must be of type: `number`.
   * @returns {Kinvey.Query} The query.
   */
  limit: function(limit) {
    // Cast arguments.
    limit = limit || null;
    if(isString(limit)) {
      limit = parseFloat(limit);
    }

    // Validate arguments.
    if(null != limit && !isNumber(limit)) {
      throw new Kinvey.Error('limit argument must be of type: number.');
    }

    // Set limit on the top-level query.
    if(null !== this._parent) {
      this._parent.limit(limit);
    }
    else {
      this._limit = limit;
    }
    return this;
  },

  /**
   * Sets the number of documents to skip from the start.
   *
   * @param {number} skip Skip.
   * @throws {Kinvey.Error} `skip` must be of type: `number`.
   * @returns {Kinvey.Query} The query.
   */
  skip: function(skip) {
    // Cast arguments.
    if(isString(skip)) {
      skip = parseFloat(skip);
    }

    // Validate arguments.
    if(!isNumber(skip)) {
      throw new Kinvey.Error('skip argument must be of type: number.');
    }

    // Set skip on the top-level query.
    if(null !== this._parent) {
      this._parent.skip(skip);
    }
    else {
      this._skip = skip;
    }
    return this;
  },

  /**
   * Adds an ascending sort modifier to the query. Sorts by `field`, ascending.
   *
   * @param {string} field Field.
   * @returns {Kinvey.Query} The query.
   */
  ascending: function(field) {
    // Add sort on the top-level query.
    if(null !== this._parent) {
      this._parent.ascending(field);
    }
    else {
      this._sort[field] = 1;
    }
    return this;
  },

  /**
   * Adds an descending sort modifier to the query. Sorts by `field`,
   * descending.
   *
   * @param {string} field Field.
   * @returns {Kinvey.Query} The query.
   */
  descending: function(field) {
    // Add sort on the top-level query.
    if(null !== this._parent) {
      this._parent.descending(field);
    }
    else {
      this._sort[field] = -1;
    }
    return this;
  },

  /**
   * Sets the sort for the query. Any existing sort parameters will be
   * discarded.
   *
   * @param {Object} [sort] Sort.
   * @throws {Kinvey.Error} `sort` must be of type: `Object`.
   * @returns {Kinvey.Query} The query.
   */
  sort: function(sort) {
    // Validate arguments.
    if(null != sort && !isObject(sort)) {
      throw new Kinvey.Error('sort argument must be of type: Object.');
    }

    // Set sort on the top-level query.
    if(null !== this._parent) {
      this._parent.sort(sort);
    }
    else {
      this._sort = sort || {};
    }
    return this;
  },

  /**
   * Returns JSON representation of the query.
   *
   * @returns {Object} JSON object-literal.
   */
  toJSON: function() {
    // If the query is part of a join, return the top-level JSON representation
    // instead.
    if(null !== this._parent) {
      return this._parent.toJSON();
    }

    // Return set of parameters.
    return {
      filter : this._filter,
      sort   : this._sort,
      skip   : this._skip,
      limit  : this._limit
    };
  },

  /**
   * Adds a filter to the query.
   *
   * @private
   * @param {string} field
   * @param {string} condition Condition.
   * @param {*} value Value.
   * @returns {Kinvey.Query} The query.
   */
  _addFilter: function(field, condition, value) {
    // Initialize the field selector.
    if(!isObject(this._filter[field])) {
      this._filter[field] = {};
    }
    this._filter[field][condition] = value;
    return this;
  },

  /**
   * Joins the current query with another query using an operator.
   *
   * @private
   * @param {string} operator Operator.
   * @param {Kinvey.Query[]|Object[]} queries Queries.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
   * @returns {Kinvey.Query} The query.
   */
  _join: function(operator, queries) {
    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    var result = this;
    queries = queries.map(function(query) {
      if(!(query instanceof Kinvey.Query)) {
        if(isObject(query)) {// Cast argument.
          query = new Kinvey.Query(query);
        }
        else {
          throw new Kinvey.Error('query argument must be of type: Kinvey.Query[] or Object[].');
        }
      }
      return query.toJSON().filter;
    });

    // If there are no `queries` supplied, create a new (empty) `Kinvey.Query`.
    // This query is the right-hand side of the join expression, and will be
    // returned to allow for a fluent interface.
    if(0 === queries.length) {
      result  = new Kinvey.Query();
      queries = [ result.toJSON().filter ];
      result._parent = this;// Required for operator precedence and `toJSON`.
    }

    // Join operators operate on the top-level of `_filter`. Since the `toJSON`
    // magic requires `_filter` to be passed by reference, we cannot simply re-
    // assign `_filter`. Instead, empty it without losing the reference.
    var currentQuery = {};
    for(var member in this._filter) {
      if(this._filter.hasOwnProperty(member)) {
        currentQuery[member] = this._filter[member];
        delete this._filter[member];
      }
    }

    // `currentQuery` is the left-hand side query. Join with `queries`.
    this._filter[operator] = [ currentQuery ].concat(queries);

    // Return the current query if there are `queries`, and the new (empty)
    // `Kinvey.Query` otherwise.
    return result;
  },

  /**
   * Post processes the raw response by applying sort, limit, and skip.
   *
   * @private
   * @param {Array} response The raw response.
   * @throws {Kinvey.Error} `response` must be of type: `Array`.
   * @returns {Array} The processed response.
   */
  _postProcess: function(response) {
    // Validate arguments.
    if(!isArray(response)) {
      throw new Kinvey.Error('response argument must be of type: Array.');
    }

    // Sorting.
    // NOTE Sorting on dot-separated (nested) fields is not supported.
    var _this = this;
    response = response.sort(function(a, b) {
      for(var field in _this._sort) {
        if(_this._sort.hasOwnProperty(field)) {
          // Elements which do not contain the field should always be sorted
          // lower.
          if('undefined' !== typeof a[field] && 'undefined' === typeof b[field]) {
            return -1;
          }
          if('undefined' !== typeof b[field] && 'undefined' === typeof a[field]) {
            return 1;
          }

          // Sort on the current field. The modifier adjusts the sorting order
          // (ascending (-1), or descending(1)). If the fields are equal,
          // continue sorting based on the next field (if any).
          if(a[field] !== b[field]) {
            var modifier = _this._sort[field];// 1 or -1.
            return (a[field] < b[field] ? -1 : 1) * modifier;
          }
        }
      }
      return 0;
    });

    // Limit and skip.
    if(null !== this._limit) {
      return response.slice(this._skip, this._skip + this._limit);
    }
    return response.slice(this._skip);
  }
};
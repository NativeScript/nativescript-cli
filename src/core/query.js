import sift from 'sift';
import isPlainObject from 'lodash/isPlainObject';
import { QueryError } from './errors';
import { nested, isDefined, isNumber } from './utils';
import { Log } from './log';

const UNSUPPORTED_CONDITIONS = ['$nearSphere'];

/**
 * The Query class is used to query for a subset of
 * entities using the Kinvey API.
 *
 * @example
 * var query = new Kinvey.Query();
 * query.equalTo('name', 'Kinvey');
 */
export class Query {
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
  constructor(options) {
    options = Object.assign({
      fields: [],
      filter: {},
      sort: null,
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
  get fields() {
    return this._fields;
  }

  /**
   * @type {string[]}
   */
  set fields(fields) {
    fields = fields || [];

    if (!Array.isArray(fields)) {
      throw new QueryError('fields must be an Array');
    }

    if (isDefined(this._parent)) {
      this._parent.fields = fields;
    } else {
      this._fields = fields;
    }
  }

  /**
   * @type {Object}
   */
  get filter() {
    return this._filter;
  }

  /**
   * @type {Object}
   */
  set filter(filter) {
    this._filter = filter;
  }

  /**
   * @type {Object}
   */
  get sort() {
    return this._sort;
  }

  /**
   * @type {Object}
   */
  set sort(sort) {
    if (sort && !isPlainObject(sort)) {
      throw new QueryError('sort must an Object');
    }

    if (isDefined(this._parent)) {
      this._parent.sort = sort;
    } else {
      this._sort = sort || {};
    }
  }

  /**
   * @type {?number}
   */
  get limit() {
    return this._limit;
  }

  /**
   * @type {?number}
   */
  set limit(limit) {
    if (typeof limit === 'string') {
      limit = parseFloat(limit);
    }

    if (isDefined(limit) && isNumber(limit) === false) {
      throw new QueryError('limit must be a number');
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
  get skip() {
    return this._skip;
  }

  /**
   * @type {number}
   */
  set skip(skip) {
    if (typeof skip === 'string') {
      skip = parseFloat(skip);
    }

    if (isNumber(skip) === false) {
      throw new QueryError('skip must be a number');
    }

    if (isDefined(this._parent)) {
      this._parent.skip = skip;
    } else {
      this._skip = skip;
    }
  }

  isSupportedOffline() {
    return Object.keys(this.filter).reduce((supported, key) => {
      if (supported) {
        const value = this.filter[key];
        return UNSUPPORTED_CONDITIONS.some((unsupportedConditions) => {
          if (!value) {
            return true;
          }

          return !Object.keys(value).some((condition) => {
            return condition === unsupportedConditions;
          });
        });
      }

      return supported;
    }, true);
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
  equalTo(field, value) {
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
  contains(field, values) {
    if (isDefined(values) === false) {
      throw new QueryError('You must supply a value.');
    }

    if (Array.isArray(values) === false) {
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
  containsAll(field, values) {
    if (isDefined(values) === false) {
      throw new QueryError('You must supply a value.');
    }

    if (Array.isArray(values) === false) {
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
  greaterThan(field, value) {
    if (isNumber(value) === false && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
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
  greaterThanOrEqualTo(field, value) {
    if (isNumber(value) === false && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
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
  lessThan(field, value) {
    if (isNumber(value) === false && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
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
  lessThanOrEqualTo(field, value) {
    if (isNumber(value) === false && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
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
  notEqualTo(field, value) {
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
  notContainedIn(field, values) {
    if (Array.isArray(values) === false) {
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
  and(...args) {
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
  nor(...args) {
    // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
    // apply the NOR onto the parent to make sure AND indeed precedes NOR.
    if (isDefined(this._parent) && Object.hasOwnProperty.call(this._parent.filter, '$and')) {
      return this._parent.nor(...args);
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
  or(...args) {
    // OR has lowest precedence. Therefore, if this query is part of any join,
    // apply the OR onto the parent to make sure OR has indeed the lowest
    // precedence.
    if (isDefined(this._parent)) {
      return this._parent.or(...args);
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
  exists(field, flag) {
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
  mod(field, divisor, remainder = 0) {
    if (typeof divisor === 'string') {
      divisor = parseFloat(divisor);
    }

    if (typeof remainder === 'string') {
      remainder = parseFloat(remainder);
    }

    if (!isNumber(divisor)) {
      throw new QueryError('divisor must be a number');
    }

    if (!isNumber(remainder)) {
      throw new QueryError('remainder must be a number');
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
  matches(field, regExp, options = {}) {
    const flags = [];

    if (!(regExp instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.source.indexOf('^') !== 0) {
      throw new QueryError('regExp must have \'^\' at the beginning of the expression'
        + ' to make it an anchored expression.');
    }

    if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
      throw new QueryError('ignoreCase flag is not supported');
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
   * @throws {QueryError} `coord` must be of type `Array<number, number>`.
   * @returns {Query} The query.
   */
  near(field, coord, maxDistance) {
    if (!Array.isArray(coord) || !isNumber(coord[0]) || !isNumber(coord[1])) {
      throw new QueryError('coord must be a [number, number]');
    }

    const result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

    if (isNumber(maxDistance)) {
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
  withinBox(field, bottomLeftCoord, upperRightCoord) {
    if (!Array.isArray(bottomLeftCoord) || !isNumber(bottomLeftCoord[0]) || !isNumber(bottomLeftCoord[1])) {
      throw new QueryError('bottomLeftCoord must be a [number, number]');
    }

    if (!Array.isArray(upperRightCoord) || !isNumber(upperRightCoord[0]) || !isNumber(upperRightCoord[1])) {
      throw new QueryError('upperRightCoord must be a [number, number]');
    }

    bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
    bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
    upperRightCoord[0] = parseFloat(upperRightCoord[0]);
    upperRightCoord[1] = parseFloat(upperRightCoord[1]);

    const coords = [
      [bottomLeftCoord[0], bottomLeftCoord[1]],
      [upperRightCoord[0], upperRightCoord[1]]
    ];
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
  withinPolygon(field, coords) {
    if (Array.isArray(coords) === false || coords.length === 0 || coords.length > 3) {
      throw new QueryError('coords must be a [[number, number]]');
    }

    coords = coords.map((coord) => {
      if (isNumber(coord[0]) === false || isNumber(coord[1]) === false) {
        throw new QueryError('coords argument must be a [number, number]');
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
  size(field, size) {
    if (typeof size === 'string') {
      size = parseFloat(size);
    }

    if (!isNumber(size)) {
      throw new QueryError('size must be a number');
    }

    return this.addFilter(field, '$size', size);
  }

  /**
   * Adds an ascending sort modifier to the query. Sorts by `field`, ascending.
   *
   * @param {string} field Field
   * @returns {Query} The query.
   */
  ascending(field) {
    if (isDefined(this._parent)) {
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
  descending(field) {
    if (isDefined(this._parent)) {
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
  addFilter(field, condition, values) {
    if (isDefined(condition)
      && (isDefined(values) || arguments.length === 3)) {
      if (!isPlainObject(this.filter[field])) {
        this.filter[field] = {};
      }

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
  join(operator, queries) {
    let that = this;
    const currentQuery = {};

    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    queries = queries.map((query) => {
      if (!(query instanceof Query)) {
        if (isPlainObject(query)) {
          query = new Query(query);
        } else {
          throw new QueryError('query argument must be of type: Kinvey.Query[] or Object[].');
        }
      }

      return query.toPlainObject().filter;
    });

    // If there are no `queries` supplied, create a new (empty) `Query`.
    // This query is the right-hand side of the join expression, and will be
    // returned to allow for a fluent interface.
    if (queries.length === 0) {
      that = new Query();
      queries = [that.toPlainObject().filter];
      that._parent = this; // Required for operator precedence and `toJSON`.
    }

    // Join operators operate on the top-level of `filter`. Since the `toJSON`
    // magic requires `filter` to be passed by reference, we cannot simply re-
    // assign `filter`. Instead, empty it without losing the reference.
    const members = Object.keys(this.filter);
    members.forEach((member) => {
      currentQuery[member] = this.filter[member];
      delete this.filter[member];
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
  process(data) {
    if (!this.isSupportedOffline()) {
      let message = 'This query is not able to run locally. The following filters are not supported'
        + ' locally:';

      UNSUPPORTED_CONDITIONS.forEach((filter) => {
        message = `${message} ${filter}`;
      });

      Log.error(message);
      throw new QueryError(message);
    }

    // Validate arguments.
    if (!Array.isArray(data)) {
      throw new QueryError('data argument must be of type: Array.');
    }

    Log.debug('Data length before processiong query', data.length);

    // Apply the query
    const json = this.toPlainObject();
    data = sift(json.filter, data);

    Log.debug('Data length after applying query filter', json.filter, data.length);

    /* eslint-disable no-restricted-syntax, no-prototype-builtins  */
    // Sorting.
    if (isDefined(json.sort)) {
      Log.debug('Sorting data', json.sort);
      data.sort((a, b) => {
        for (const field in json.sort) {
          if (json.sort.hasOwnProperty(field)) {
            // Find field in objects.
            const aField = nested(a, field);
            const bField = nested(b, field);

            if (isDefined(aField) && isDefined(bField) === false) {
              return -1;
            } else if (isDefined(bField) && isDefined(aField) === false) {
              return 1;
            } else if (aField !== bField) {
              const modifier = json.sort[field]; // 1 or -1.
              return (aField < bField ? -1 : 1) * modifier;
            }
          }
        }

        return 0;
      });
    }
    /* eslint-enable no-restricted-syntax, no-prototype-builtins */

    // Remove fields
    if (Array.isArray(json.fields) && json.fields.length > 0) {
      Log.debug('Removing fields from data', json.fields);
      data = data.map((item) => {
        const keys = Object.keys(item);
        keys.forEach((key) => {
          if (json.fields.indexOf(key) === -1) {
            delete item[key];
          }
        });

        return item;
      });
    }

    // Limit and skip.
    if (isNumber(json.skip)) {
      if (isNumber(json.limit) && json.limit > 0) {
        Log.debug('Skipping and limiting data', json.skip, json.limit);
        return data.slice(json.skip, json.skip + json.limit);
      }

      Log.debug('Skipping data', json.skip);
      return data.slice(json.skip);
    }

    return data;
  }

  /**
   * Returns Object representation of the query.
   *
   * @returns {Object} Object
   */
  toPlainObject() {
    if (isDefined(this._parent)) {
      return this._parent.toPlainObject();
    }

    // Return set of parameters.
    const json = {
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
   * @returns {Object} Query string object.
   */
  toQueryString() {
    const queryString = {};

    if (Object.keys(this.filter).length > 0) {
      queryString.query = this.filter;
    }

    if (this.fields.length > 0) {
      queryString.fields = this.fields.join(',');
    }

    if (isNumber(this.limit)) {
      queryString.limit = this.limit;
    }

    if (isNumber(this.skip) && this.skip > 0) {
      queryString.skip = this.skip;
    }

    if (Object.keys(this.sort).length > 0) {
      queryString.sort = this.sort;
    }

    const keys = Object.keys(queryString);
    keys.forEach((key) => {
      queryString[key] = typeof queryString[key] === 'string' ? queryString[key] : JSON.stringify(queryString[key]);
    });

    return queryString;
  }

  /**
   * Returns query string representation of the query.
   *
   * @return {string} Query string string.
   */
  toString() {
    return JSON.stringify(this.toQueryString());
  }
}

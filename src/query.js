import { nested } from './utils/object';
import sift from 'sift';
import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isRegExp from 'lodash/isRegExp';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';

export class Query {
  constructor(options) {
    options = assign({
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

  get fields() {
    return this.queryFields;
  }

  set fields(fields) {
    fields = fields || [];

    if (!isArray(fields)) {
      throw new Error('fields must be an Array');
    }

    if (this.parent) {
      this.parent.fields = fields;
    } else {
      this.queryFields = fields;
    }
  }

  get filter() {
    return this.queryFilter;
  }

  set filter(filter) {
    this.queryFilter = filter;
  }

  get sort() {
    return this.querySort;
  }

  set sort(sort) {
    if (sort && !isObject(sort)) {
      throw new Error('sort must an Object');
    }

    if (this.parent) {
      this.parent.sort(sort);
    } else {
      this.querySort = sort || {};
    }
  }

  get limit() {
    return this.queryLimit;
  }

  set limit(limit) {
    if (isString(limit)) {
      limit = parseFloat(limit);
    }

    if (limit && !isNumber(limit)) {
      throw new Error('limit must be a number');
    }

    if (this.parent) {
      this.parent.limit = limit;
    } else {
      this.queryLimit = limit;
    }
  }

  get skip() {
    return this.querySkip;
  }

  set skip(skip) {
    if (isString(skip)) {
      skip = parseFloat(skip);
    }

    if (!isNumber(skip)) {
      throw new Error('skip must be a number');
    }

    if (this.parent) {
      this.parent.skip(skip);
    } else {
      this.querySkip = skip;
    }
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
  equalTo(field, value) {
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
  contains(field, values) {
    if (!isArray(values)) {
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
  containsAll(field, values) {
    if (!isArray(values)) {
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
  greaterThan(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new Error('You must supply a number or string.');
    }

    return this.addFilter(field, '$gt', value);
  }

  greaterThanOrEqualTo(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new Error('You must supply a number or string.');
    }

    return this.addFilter(field, '$gte', value);
  }

  lessThan(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new Error('You must supply a number or string.');
    }

    return this.addFilter(field, '$lt', value);
  }

  lessThanOrEqualTo(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new Error('You must supply a number or string.');
    }

    return this.addFilter(field, '$lte', value);
  }

  notEqualTo(field, value) {
    return this.addFilter(field, '$ne', value);
  }

  notContainedIn(field, values) {
    if (!isArray(values)) {
      values = [values];
    }

    return this.addFilter(field, '$nin', values);
  }

  and(...args) {
    return this.join('$and', Array.prototype.slice.call(args));
  }

  nor(...args) {
    if (this.parent && this.parent.filter.$and) {
      return this.parent.nor.apply(this.parent, args);
    }

    return this.join('$nor', Array.prototype.slice.call(args));
  }

  or(...args) {
    if (this.parent) {
      return this.parent.or.apply(this.parent, args);
    }

    return this.join('$or', Array.prototype.slice.call(args));
  }

  exists(field, flag) {
    flag = typeof flag === 'undefined' ? true : flag || false;
    return this.addFilter(field, '$exists', flag);
  }

  mod(field, divisor, remainder) {
    remainder = remainder || 0;

    if (isString(divisor)) {
      divisor = parseFloat(divisor);
    }

    if (isString(remainder)) {
      remainder = parseFloat(remainder);
    }

    if (!isNumber(divisor)) {
      throw new Error('divisor must be a number');
    }

    if (!isNumber(remainder)) {
      throw new Error('remainder must be a number');
    }

    return this.addFilter(field, '$mod', [divisor, remainder]);
  }

  matches(field, regExp, options) {
    options = options || {};

    if (!isRegExp(regExp)) {
      regExp = new RegExp(regExp);
    }

    if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
      throw new Error('ignoreCase glag is not supported.');
    }

    if (regExp.source.indexOf('^') !== 0) {
      throw new Error('regExp must have `^` at the beginning of the expression ' +
        'to make it an anchored expression.');
    }

    const flags = [];

    if ((regExp.multiline || options.multiline) && options.multiline !== false) {
      flags.push('m');
    }

    if (options.extended) {
      flags.push('x');
    }

    if (options.dotMatchesAll) {
      flags.push('s');
    }

    const result = this.addFilter(field, '$regex', regExp.source);

    if (flags.length) {
      this.addFilter(field, '$options', flags.join(''));
    }

    return result;
  }

  near(field, coord, maxDistance) {
    if (!isArray(coord) || !coord[0] || !coord[1]) {
      throw new Error('coord must be a [number, number]');
    }

    coord[0] = parseFloat(coord[0]);
    coord[1] = parseFloat(coord[1]);

    const result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

    if (maxDistance) {
      this.addFilter(field, '$maxDistance', maxDistance);
    }

    return result;
  }

  withinBox(field, bottomLeftCoord, upperRightCoord) {
    if (!isArray(bottomLeftCoord) || !bottomLeftCoord[0] || !bottomLeftCoord[1]) {
      throw new Error('bottomLeftCoord must be a [number, number]');
    }

    if (!isArray(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
      throw new Error('upperRightCoord must be a [number, number]');
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

  withinPolygon(field, coords) {
    if (!isArray(coords) || coords.length > 3) {
      throw new Error('coords must be [[number, number]]');
    }

    coords = coords.map(coord => {
      if (!coord[0] || !coord[1]) {
        throw new Error('coords argument must be [number, number]');
      }

      return [parseFloat(coord[0]), parseFloat(coord[1])];
    });

    return this.addFilter(field, '$within', { $polygon: coords });
  }

  size(field, size) {
    if (isString(size)) {
      size = parseFloat(size);
    }

    if (!isNumber(size)) {
      throw new Error('size must be a number');
    }

    return this.addFilter(field, '$size', size);
  }

  ascending(field) {
    if (this.parent) {
      this.parent.ascending(field);
    } else {
      this.sort[field] = 1;
    }

    return this;
  }

  descending(field) {
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
  addFilter(field, condition, values) {
    if (!isObject(this.filter[field])) {
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
  join(operator, queries) {
    let that = this;
    const currentQuery = {};

    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    queries = queries.map(query => {
      if (!(query instanceof Query)) {
        if (isObject(query)) {
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
    const members = Object.keys(this.filter);
    forEach(members, member => {
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
   * Processes the data by applying fields, sort, limit, and skip.
   *
   * @param   {Array}   data    The raw data.
   * @throws  {Error}               `data` must be of type: `Array`.
   * @returns {Array}               The processed data.
   */
  _process(data) {
    if (data) {
      // Validate arguments.
      if (!isArray(data)) {
        throw new Error('data argument must be of type: Array.');
      }

      // Apply the query
      const json = this.toJSON();
      data = sift(json.filter, data);

      // Remove fields
      if (json.fields && json.fields.length > 0) {
        data = data.map((item) => {
          const keys = Object.keys(item);
          forEach(keys, key => {
            if (json.fields.indexOf(key) === -1) {
              delete item[key];
            }
          });

          return item;
        });
      }

      // Sorting.
      data = data.sort((a, b) => {
        const fields = Object.keys(json.sort);
        forEach(fields, field => {
          // Find field in objects.
          const aField = nested(a, field);
          const bField = nested(b, field);

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
            const modifier = json.sort[field]; // 1 or -1.
            return (aField < bField ? -1 : 1) * modifier;
          }

          return 0;
        });

        return 0;
      });

      // Limit and skip.
      if (json.limit) {
        return data.slice(json.skip, json.skip + json.limit);
      }

      return data.slice(json.skip);
    }

    return data;
  }

  /**
   * Returns JSON representation of the query.
   *
   * @returns {Object} JSON object-literal.
   */
  toJSON() {
    if (this.parent) {
      return this.parent.toJSON();
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
   * Returns serialized representation that can be appended
   * to network paths as a query parameter.
   *
   * @returns {Object} Query string object
   */
  toQueryString() {
    const queryString = {};

    if (!isEmpty(this.filter)) {
      queryString.query = this.filter;
    }

    if (!isEmpty(this.fields)) {
      queryString.fields = this.fields.join(',');
    }

    if (this.limit) {
      queryString.limit = this.limit;
    }

    if (this.skip > 0) {
      queryString.skip = this.skip;
    }

    if (!isEmpty(this.sort)) {
      queryString.sort = this.sort;
    }

    const keys = Object.keys(queryString);
    forEach(keys, key => {
      queryString[key] = isString(queryString[key]) ? queryString[key] : JSON.stringify(queryString[key]);
    });

    return queryString;
  }

  toString() {
    return JSON.stringify(this.toQueryString());
  }
}

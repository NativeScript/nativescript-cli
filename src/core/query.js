import { nested } from './utils/object';
import sift from 'sift';
import clone from 'lodash/clone';
import assign from 'lodash/assign';
import isArray from 'lodash/isArray';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isRegExp from 'lodash/isRegExp';
const privateQuerySymbol = Symbol();

class PrivateQuery {
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
  equalTo(field, value) {
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

  and() {
    return this.join('$and', Array.prototype.slice.call(arguments));
  }

  nor() {
    if (this.parent && this.parent.filter.$and) {
      return this.parent.nor.apply(this.parent, arguments);
    }

    return this.join('$nor', Array.prototype.slice.call(arguments));
  }

  or() {
    if (this.parent) {
      return this.parent.or.apply(this.parent, arguments);
    }

    return this.join('$or', Array.prototype.slice.call(arguments));
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
      throw new Error('Divisor must be a number.');
    }

    if (!isNumber(remainder)) {
      throw new Error('Remainder must be a number.');
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
      throw new Error('coord argument must be of type: [number, number]');
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
      throw new Error('bottomLeftCoord argument must be of type: [number, number]');
    }

    if (!isArray(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
      throw new Error('upperRightCoord argument must be of type: [number, number]');
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

  size(field, size) {
    if (isString(size)) {
      size = parseFloat(size);
    }

    if (!isNumber(size)) {
      throw new Error('size argument must be a number');
    }

    return this.addFilter(field, '$size', size);
  }

  fields(fields) {
    fields = fields || [];

    if (!isArray(fields)) {
      throw new Error('fields argument must an Array.');
    }

    if (this.parent) {
      this.parent.fields(fields);
    } else {
      this._fields = fields;
    }

    return this;
  }

  limit(limit) {
    if (isString(limit)) {
      limit = parseFloat(limit);
    }

    if (limit && !isNumber(limit)) {
      throw new Error('limit argument must be of type: number.');
    }

    if (this._parent) {
      this.parent.limit(limit);
    } else {
      this._limit = limit;
    }

    return this;
  }

  skip(skip) {
    if (isString(skip)) {
      skip = parseFloat(skip);
    }

    if (!isNumber(skip)) {
      throw new Error('skip argument must be of type: number.');
    }

    if (this.parent) {
      this.parent.skip(skip);
    } else {
      this._skip = skip;
    }

    return this;
  }

  ascending(field) {
    if (this.parent) {
      this.parent.ascending(field);
    } else {
      this._sort[field] = 1;
    }

    return this;
  }

  descending(field) {
    if (this.parent) {
      this.parent.descending(field);
    } else {
      this._sort[field] = -1;
    }

    return this;
  }

  sort(sort) {
    if (sort && !isObject(sort)) {
      throw new Error('sort argument must be of type: Object.');
    }

    if (this.parent) {
      this.parent.sort(sort);
    } else {
      this._sort = sort || {};
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
    if (!isObject(this._filter[field])) {
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
  join(operator, queries) {
    let _this = this;
    const currentQuery = {};

    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    queries = queries.map(function (query) {
      if (!(query instanceof PrivateQuery)) {
        if (isObject(query)) {
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
    for (const member in this._filter) {
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
          for (const key in item) {
            if (item.hasOwnProperty(key) && json.fields.indexOf(key) === -1) {
              delete item[key];
            }
          }

          return item;
        });
      }

      // Sorting.
      data = data.sort((a, b) => {
        for (const field in json.sort) {
          if (json.sort.hasOwnProperty(field)) {
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
          }
        }

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
      fields: this._fields,
      filter: this._filter,
      sort: this._sort,
      skip: this._skip,
      limit: this._limit
    };

    return clone(json, true);
  }
}

export default class Query {
  constructor(options) {
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
  equalTo(field, value) {
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
  contains(field, values) {
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
  containsAll(field, values) {
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
  greaterThan(field, value) {
    this[privateQuerySymbol].greaterThan(field, value);
    return this;
  }

  greaterThanOrEqualTo(field, value) {
    this[privateQuerySymbol].greaterThanOrEqualToe(field, value);
    return this;
  }

  lessThan(field, value) {
    this[privateQuerySymbol].lessThan(field, value);
    return this;
  }

  lessThanOrEqualTo(field, value) {
    this[privateQuerySymbol].lessThanOrEqualTo(field, value);
    return this;
  }

  notEqualTo(field, value) {
    this[privateQuerySymbol].notEqualTo(field, value);
    return this;
  }

  notContainedIn(field, values) {
    this[privateQuerySymbol].notContainedIn(field, values);
    return this;
  }

  and() {
    this[privateQuerySymbol].and.apply(this[privateQuerySymbol], arguments);
    return this;
  }

  nor() {
    this[privateQuerySymbol].nor.apply(this[privateQuerySymbol], arguments);
    return this;
  }

  or() {
    this[privateQuerySymbol].or.apply(this[privateQuerySymbol], arguments);
    return this;
  }

  exists(field, flag) {
    this[privateQuerySymbol].exists(field, flag);
    return this;
  }

  mod(field, divisor, remainder) {
    this[privateQuerySymbol].mod(field, divisor, remainder);
    return this;
  }

  matches(field, regExp, options) {
    this[privateQuerySymbol].matches(field, regExp, options);
    return this;
  }

  near(field, coord, maxDistance) {
    this[privateQuerySymbol].near(field, coord, maxDistance);
    return this;
  }

  withinBox(field, bottomLeftCoord, upperRightCoord) {
    this[privateQuerySymbol].withinBox(field, bottomLeftCoord, upperRightCoord);
    return this;
  }

  withinPolygon(field, coords) {
    this[privateQuerySymbol].withinPolygon(field, coords);
    return this;
  }

  size(field, size) {
    this[privateQuerySymbol].size(field, size);
    return this;
  }

  fields(fields) {
    this[privateQuerySymbol].fields(fields);
    return this;
  }

  limit(limit) {
    this[privateQuerySymbol].limit(limit);
    return this;
  }

  skip(skip) {
    this[privateQuerySymbol].skip(skip);
    return this;
  }

  ascending(field) {
    this[privateQuerySymbol].ascending(field);
    return this;
  }

  descending(field) {
    this[privateQuerySymbol].descending(field);
    return this;
  }

  sort(sort) {
    this[privateQuerySymbol].sort(sort);
    return this;
  }

  _process(data) {
    return this[privateQuerySymbol]._process(data);
  }

  /**
   * Returns JSON representation of the query.
   *
   * @returns {Object} JSON object-literal.
   */
  toJSON() {
    return this[privateQuerySymbol].toJSON();
  }
}

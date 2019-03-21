import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import sift from 'sift';
import QueryError from './errors/query';

const UNSUPPORTED_CONDITIONS = ['$nearSphere'];
const PROTECTED_FIELDS = ['_id', '_acl'];

function nested(obj, dotProperty, value?) {
  if (!dotProperty) {
    return value || obj;
  }

  const parts = dotProperty.split('.');
  let currentProperty = parts.shift();
  let currentObj = obj;

  while (currentProperty && typeof currentObj !== 'undefined') {
    currentObj = currentObj[currentProperty];
    currentProperty = parts.shift();
  }

  return typeof currentObj === 'undefined' ? value : currentObj;
}

export default class Query {
  public _fields: any;
  public filter: any;
  public _sort: any;
  public _limit: any;
  public _skip: any;
  private _parent?: Query;

  constructor(query?) {
    const config = Object.assign({}, {
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

  get fields() {
    return this._fields;
  }

  set fields(fields) {
    if (!Array.isArray(fields)) {
      throw new QueryError('fields must be an Array');
    }

    if (this._parent) {
      this._parent.fields = fields;
    } else {
      this._fields = fields;
    }
  }

  get sort() {
    return this._sort;
  }

  set sort(sort) {
    if (sort && !isPlainObject(sort)) {
      throw new QueryError('sort must an Object');
    }

    if (this._parent) {
      this._parent.sort = sort;
    } else {
      this._sort = sort;
    }
  }

  get limit() {
    return this._limit;
  }

  set limit(limit) {
    let _limit = limit;

    if (isString(_limit)) {
      _limit = parseFloat(_limit);
    }

    if (limit && !isNumber(_limit)) {
      throw new QueryError('limit must be a number');
    }

    if (this._parent) {
      this._parent.limit = _limit;
    } else {
      this._limit = _limit;
    }
  }

  get skip() {
    return this._skip;
  }

  set skip(skip) {
    let _skip = skip;

    if (isString(_skip)) {
      _skip = parseFloat(_skip);
    }

    if (!isNumber(_skip)) {
      throw new QueryError('skip must be a number');
    }

    if (this._parent) {
      this._parent.skip = _skip;
    } else {
      this._skip = _skip;
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

          if (!isObject(value)) {
            return true;
          }

          return !Object.keys(value).some((condition) => condition === unsupportedConditions);
        });
      }

      return supported;
    }, true);
  }

  equalTo(field, value) {
    return this.addFilter(field, value);
  }

  notEqualTo(field, value) {
    return this.addFilter(field, '$ne', value);
  }

  contains(field, values) {
    if (!values) {
      throw new QueryError('You must supply a value.');
    }

    if (!Array.isArray(values)) {
      return this.addFilter(field, '$in', [values]);
    }

    return this.addFilter(field, '$in', values);
  }

  notContainedIn(field, values) {
    if (!values) {
      throw new QueryError('You must supply a value.');
    }

    if (!Array.isArray(values)) {
      return this.addFilter(field, '$nin', [values]);
    }

    return this.addFilter(field, '$nin', values);
  }

  containsAll(field, values) {
    if (!values) {
      throw new QueryError('You must supply a value.');
    }

    if (!Array.isArray(values)) {
      return this.addFilter(field, '$all', [values]);
    }

    return this.addFilter(field, '$all', values);
  }

  greaterThan(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gt', value);
  }

  greaterThanOrEqualTo(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gte', value);
  }

  lessThan(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lt', value);
  }

  lessThanOrEqualTo(field, value) {
    if (!isNumber(value) && !isString(value)) {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lte', value);
  }

  exists(field, flag = true) {
    return this.addFilter(field, '$exists', flag === true);
  }

  mod(field, divisor, remainder = 0) {
    if (!isNumber(divisor)) {
      throw new QueryError('divisor must be a number');
    }

    if (!isNumber(remainder)) {
      throw new QueryError('remainder must be a number');
    }

    return this.addFilter(field, '$mod', [divisor, remainder]);
  }

  matches(field, expression, options: any = {}) {
    const flags = [];
    let regExp = expression;

    if (!(regExp instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.source.indexOf('^') !== 0) {
      throw new QueryError(
        'regExp must have \'^\' at the beginning of the expression to make it an anchored expression.'
      );
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

  withinBox(field, bottomLeftCoord, upperRightCoord) {
    if (!Array.isArray(bottomLeftCoord)
      || !isNumber(bottomLeftCoord[0])
      || !isNumber(bottomLeftCoord[1])) {
      throw new QueryError('bottomLeftCoord must be a [number, number]');
    }

    if (!Array.isArray(upperRightCoord)
      || !isNumber(upperRightCoord[0])
      || !isNumber(upperRightCoord[1])) {
      throw new QueryError('upperRightCoord must be a [number, number]');
    }

    const coords = [
      [bottomLeftCoord[0], bottomLeftCoord[1]],
      [upperRightCoord[0], upperRightCoord[1]]
    ];
    return this.addFilter(field, '$within', { $box: coords });
  }

  withinPolygon(field, coords) {
    if (Array.isArray(coords) === false || coords.length === 0 || coords[0].length > 3) {
      throw new QueryError('coords must be a [[number, number]]');
    }

    const withinCoords = coords.map((coord) => {
      if (!isNumber(coord[0]) || !isNumber(coord[1])) {
        throw new QueryError('coords argument must be a [number, number]');
      }

      return [coord[0], coord[1]];
    });

    return this.addFilter(field, '$within', { $polygon: withinCoords });
  }

  size(field, size) {
    if (!isNumber(size)) {
      throw new QueryError('size must be a number');
    }

    return this.addFilter(field, '$size', size);
  }

  ascending(field) {
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

  descending(field) {
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

  and(...args) {
    // AND has highest precedence. Therefore, even if this query is part of a
    // JOIN already, apply it on this query.
    return this.join('$and', args);
  }

  nor(...args) {
    // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
    // apply the NOR onto the parent to make sure AND indeed precedes NOR.
    if (this._parent && Object.hasOwnProperty.call(this._parent.filter, '$and')) {
      return this._parent.nor(...args);
    }

    return this.join('$nor', args);
  }

  or(...args) {
    // OR has lowest precedence. Therefore, if this query is part of any join,
    // apply the OR onto the parent to make sure OR has indeed the lowest
    // precedence.
    if (this._parent) {
      return this._parent.or(...args);
    }

    return this.join('$or', args);
  }

  toQueryObject() {
    const queryObject: any = {};

    if (Object.keys(this.filter).length > 0) {
      queryObject.query = this.filter;
    }

    if (this.fields.length > 0) {
      queryObject.fields = this.fields.join(',');
    }

    if (isNumber(this.limit) && this.limit < Infinity) {
      queryObject.limit = this.limit;
    }

    if (isNumber(this.skip) && this.skip > 0) {
      queryObject.skip = this.skip;
    }

    if (this.sort && Object.keys(this.sort).length > 0) {
      queryObject.sort = this.sort;
    }

    const keys = Object.keys(queryObject);
    keys.forEach((key) => {
      queryObject[key] = isString(queryObject[key]) ? queryObject[key] : JSON.stringify(queryObject[key]);
    });

    return queryObject;
  }

  toQueryString() {
    return this.toQueryObject();
  }

  toPlainObject() {
    if (this._parent) {
      return this._parent.toPlainObject();
    }

    const json = {
      fields: this.fields,
      filter: this.filter,
      sort: this.sort,
      skip: this.skip,
      limit: this.limit
    };

    return json;
  }

  toString() {
    return JSON.stringify(this.toQueryString());
  }

  addFilter(field, ...args) {
    const { condition, values } = args.length === 2
      ? { condition: args[0], values: args[1] }
      : { condition: undefined, values: args[0] };

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

  join(operator, queries) {
    let that: any = this;
    let filters = queries.map(query => query.filter);

    if (filters.length === 0) {
      that = new Query();
      filters = [that.filter];
      that._parent = this; // Required for operator precedence
    }

    const currentFilter = Object.keys(this.filter).reduce((filter, key) => {
      // eslint-disable-next-line no-param-reassign
      filter[key] = this.filter[key];
      delete this.filter[key];
      return filter;
    }, {});

    this.addFilter(operator, [currentFilter].concat(filters));
    return that;
  }

  process(docs = []) {
    if (!Array.isArray(docs)) {
      throw new Error('data argument must be of type: Array.');
    }

    if (!this.isSupportedOffline()) {
      throw new Error('This query is not able to run locally.')
    }

    if (docs.length > 0) {
      let processedDocs;

      if (this.filter && !isEmpty(this.filter)) {
        processedDocs = sift(this.filter, docs);
      } else {
        processedDocs = docs;
      }

      if (!isEmpty(this.sort)) {
        // eslint-disable-next-line arrow-body-style
        processedDocs.sort((a, b) => {
          return Object.keys(this.sort)
            .reduce((result: any, field) => {
              if (typeof result !== 'undefined' && result !== 0) {
                return result;
              }

              if (Object.prototype.hasOwnProperty.call(this.sort, field)) {
                const aField = nested(a, field);
                const bField = nested(b, field);
                const modifier = this.sort[field]; // -1 (descending) or 1 (ascending)

                if ((aField !== null && typeof aField !== 'undefined')
                  && (bField === null || typeof bField === 'undefined')) {
                  return 1 * modifier;
                } else if ((bField !== null && typeof bField !== 'undefined')
                  && (aField === null || typeof aField === 'undefined')) {
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

      if (isNumber(this.skip) && this.skip > 0) {
        if (isNumber(this.limit) && this.limit < Infinity) {
          processedDocs = processedDocs.slice(this.skip, this.skip + this.limit);
        } else {
          processedDocs = processedDocs.slice(this.skip);
        }
      } else if (isNumber(this.limit) && this.limit < Infinity) {
        processedDocs = processedDocs.slice(0, this.limit);
      }

      if (isArray(this.fields) && this.fields.length > 0) {
        processedDocs = processedDocs.map((doc) => {
          const modifiedDoc = doc;
          Object.keys(modifiedDoc).forEach((key) => {
            if (this.fields.indexOf(key) === -1 && PROTECTED_FIELDS.indexOf(key) === -1) {
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
}

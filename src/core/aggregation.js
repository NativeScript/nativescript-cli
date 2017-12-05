import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import cloneDeep from 'lodash/cloneDeep';
import { KinveyError } from './errors';
import { isDefined } from './utils';
import { Query } from './query';

export class Aggregation {
  constructor(options) {
    options = assign({
      query: null,
      initial: {},
      key: {},
      reduceFn: function () {}.toString()
    }, options);

    this.query = options.query;
    this.initial = options.initial;
    this.key = options.key;
    this.reduceFn = options.reduceFn;
  }

  get initial() {
    return cloneDeep(this._initial);
  }

  set initial(initial) {
    if (!isObject(initial)) {
      throw new KinveyError('initial must be an Object.');
    }

    this._initial = initial;
  }

  get query() {
    return this._query;
  }

  set query(query) {
    if (isDefined(query) && !(query instanceof Query)) {
      throw new KinveyError('Invalid query. It must be an instance of the Query class.');
    }

    this._query = query;
  }

  get reduceFn() {
    return this._reduceFn;
  }

  set reduceFn(fn) {
    if (isFunction(fn)) {
      fn = fn.toString();
    }

    if (!isString(fn)) {
      throw new KinveyError('fn argument must be of type function or string.');
    }

    this._reduceFn = fn;
  }

  by(field) {
    this.key[field] = true;
    return this;
  }

  process(entities = []) {
    const aggregation = this.toPlainObject();
    const keys = Object.keys(aggregation.key);
    const reduceFn = aggregation.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduceFn); // eslint-disable-line no-new-func

    if (this.query) {
      entities = this.query.process(entities);
    }

    if (keys.length > 0) {
      const results = [];

      keys.forEach((key) => {
        const groups = {};

        entities.forEach((entity) => {
          const keyVal = entity[key];
          let result = isDefined(groups[keyVal]) ? groups[keyVal] : cloneDeep(aggregation.initial);
          const newResult = aggregation.reduce(entity, result);

          if (isDefined(newResult)) {
            result = newResult;
          }

          groups[keyVal] = result;
        });

        Object.keys(groups).forEach((groupKey) => {
          let result = {};
          result[key] = groupKey;
          result = assign({}, result, groups[groupKey]);
          results.push(result);
        });
      });

      return results;
    }

    let result = cloneDeep(aggregation.initial);
    forEach(entities, (entity) => {
      const newResult = aggregation.reduce(entity, result);

      if (isDefined(newResult)) {
        result = newResult;
      }
    });
    return result;
  }

  toPlainObject() {
    return {
      key: this.key,
      initial: this.initial,
      reduce: this.reduceFn,
      reduceFn: this.reduceFn,
      condition: this.query ? this.query.toPlainObject().filter : {},
      query: this.query ? this.query.toPlainObject() : null
    };
  }

  static count(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.by(field);
    aggregation.initial = { count: 0 };
    aggregation.reduceFn = ''
      + 'function(doc, out) {'
      + '  out.count += 1;'
      + '  return out;'
      + '}';
    return aggregation;
  }

  static sum(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    // aggregation.by(field);
    aggregation.initial = { sum: 0 };
    aggregation.reduceFn = ''
      + 'function(doc, out) {'
      + `  out.sum += doc["${field}"];`
      + '  return out;'
      + '}';
    return aggregation;
  }

  static min(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    // aggregation.by(field);
    aggregation.initial = { min: Infinity };
    aggregation.reduceFn = ''
      + 'function(doc, out) {'
      + `  out.min = Math.min(out.min, doc["${field}"]);`
      + '  return out;'
      + '}';
    return aggregation;
  }

  static max(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    // aggregation.by(field);
    aggregation.initial = { max: -Infinity };
    aggregation.reduceFn = ''
      + 'function(doc, out) {'
      + `  out.max = Math.max(out.max, doc["${field}"]);`
      + '  return out;'
      + '}';
    return aggregation;
  }

  static average(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    // aggregation.by(field);
    aggregation.initial = { count: 0, average: 0 };
    aggregation.reduceFn = ''
      + 'function(doc, out) {'
      + `  out.average = (out.average * out.count + doc["${field}"]) / (out.count + 1);`
      + '  out.count += 1;'
      + '  return out;'
      + '}';
    return aggregation;
  }
}

import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import { KinveyError } from './errors';
import { Query } from './query';
import { isDefined } from './utils';

/**
 * @private
 */
export default class Aggregation {
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
    return this._initial;
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
    const groups = {};
    const result = [];
    const aggregation = this.toJSON();
    const reduceFn = aggregation.reduceFn.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduceFn); // eslint-disable-line no-new-func

    if (this.query) {
      entities = this.query.process(entities);
    }

    forEach(entities, (entity) => {
      const group = {};
      const entityNames = Object.keys(entity);

      forEach(entityNames, (name) => {
        group[name] = entity[name];
      });

      const key = JSON.stringify(group);
      if (!groups[key]) {
        groups[key] = group;
        const attributes = Object.keys(aggregation.initial);

        forEach(attributes, (attr) => {
          groups[key][attr] = aggregation.initial[attr];
        });
      }

      aggregation.reduce(entity, groups[key]);
    });

    const segments = Object.keys(groups);
    forEach(segments, (segment) => {
      result.push(groups[segment]);
    });

    return result;
  }

  toJSON() {
    const json = {
      key: this.key,
      initial: this.initial,
      reduceFn: this.reduceFn,
      condition: this.query ? this.query.toJSON().filter : {},
      query: this.query ? this.query.toJSON() : null
    };

    return json;
  }

  static count(field = '') {
    const aggregation = new Aggregation();

    if (field) {
      aggregation.by(field);
    }

    aggregation.initial = { result: 0 };
    aggregation.reduceFn = (doc, out) => {
      out.result += 1;
      return out;
    };
    return aggregation;
  }

  static sum(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { result: 0 };
    aggregation.reduceFn = (doc, out) => {
      out.result += doc[`'${field}'`];
    };
    return aggregation;
  }

  static min(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { result: Infinity };
    aggregation.reduceFn = (doc, out) => {
      out.result = Math.min(out.result, doc[`'${field}'`]);
    };
    return aggregation;
  }

  static max(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { result: -Infinity };
    aggregation.reduceFn = (doc, out) => {
      out.result = Math.max(out.result, doc[`'${field}'`]);
    };
    return aggregation;
  }

  static average(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial = { count: 0, result: 0 };
    aggregation.reduceFn = (doc, out) => {
      out.result = ((out.result * out.count) + doc[`'${field}'`]) / (out.count + 1);
      out.count += 1;
    };
    return aggregation;
  }
}

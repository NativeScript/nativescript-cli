import { KinveyError } from './errors';
import Query from './query';
import clone from 'lodash/clone';
import result from 'lodash/result';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
const privateAggregationSymbol = Symbol();

class PrivateAggregation {
  constructor(options) {
    options = assign({
      query: null,
      initial: {},
      key: {},
      reduce: function () {}.toString()
    }, options);

    this.query(options.query);
    this._initial = options.initial;
    this._key = options.key;
    this._reduce = options.reduce;
  }

  by(field) {
    this._key[field] = true;
    return this;
  }

  initial(objectOrKey, value) {
    if (typeof value === 'undefined' && !isObject(objectOrKey)) {
      throw new KinveyError('objectOrKey argument must be an Object.');
    }

    if (isObject(objectOrKey)) {
      this._initial = objectOrKey;
    } else {
      this._initial[objectOrKey] = value;
    }

    return this;
  }

  query(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    this._query = query;
    return this;
  }

  process(documents = []) {
    const groups = {};
    const response = [];
    const aggregation = this.toJSON();
    const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce); // eslint-disable-line no-new-func

    if (this._query) {
      documents = this._query.process(documents);
    }

    forEach(documents, document => {
      const group = {};

      for (const name in document) {
        if (document.hasOwnProperty(name)) {
          group[name] = document[name];
        }
      }

      const key = JSON.stringify(group);
      if (!groups[key]) {
        groups[key] = group;

        for (const attr in aggregation.initial) {
          if (aggregation.initial.hasOwnProperty(attr)) {
            groups[key][attr] = aggregation.initial[attr];
          }
        }
      }

      aggregation.reduce(document, groups[key]);
    });

    for (const segment in groups) {
      if (groups.hasOwnProperty(segment)) {
        response.push(groups[segment]);
      }
    }

    return response;
  }

  reduce(fn) {
    if (isFunction(fn)) {
      fn = fn.toString();
    }

    if (!isString(fn)) {
      throw new KinveyError('fn argument must be of type function or string.');
    }

    this._reduce = fn;
    return this;
  }

  toJSON() {
    const json = {
      key: this._key,
      initial: this._initial,
      reduce: this._reduce,
      condition: this._query ? this._query.toJSON().filter : {},
      query: this._query ? this._query.toJSON() : null
    };

    return clone(json, true);
  }
}

export default class Aggregation {
  constructor(options) {
    this[privateAggregationSymbol] = new PrivateAggregation(options);
  }

  by(field) {
    this[privateAggregationSymbol].by(field);
    return this;
  }

  initial(objectOrKey, value) {
    this[privateAggregationSymbol].initial(objectOrKey, value);
    return this;
  }

  process(response) {
    return this[privateAggregationSymbol].process(response);
  }

  query(query) {
    this[privateAggregationSymbol].query(query);
    return this;
  }

  reduce(fn) {
    this[privateAggregationSymbol].reduce(fn);
    return this;
  }

  toJSON() {
    return this[privateAggregationSymbol].toJSON();
  }

  static count(field = '') {
    const aggregation = new Aggregation();

    if (field) {
      aggregation.by(field);
    }

    aggregation.initial({ result: 0 });
    aggregation.reduce(function (doc, out) {
      out.result += 1;
    });
    return aggregation;
  }

  static sum(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial({ result: 0 });
    aggregation.reduce(`function(doc, out) { ` +
      ` out.result += doc["${field}"]; ` +
      `}`
    );
    return aggregation;
  }

  static min(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial({ result: Infinity });
    aggregation.reduce(`function(doc, out) { ` +
      ` out.result = Math.min(out.result, doc["${field}"]); ` +
      `}`
    );
    return aggregation;
  }

  static max(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial({ result: -Infinity });
    aggregation.reduce(`function(doc, out) { ` +
      ` out.result = Math.max(out.result, doc["${field}"]); ` +
      `}`
    );
    return aggregation;
  }

  static average(field = '') {
    field = field.replace('\'', '\\\'');

    const aggregation = new Aggregation();
    aggregation.initial({ count: 0, result: 0 });
    aggregation.reduce(`function(doc, out) { ` +
      ` out.result = (out.result * out.count + doc["${field}"]) / (out.count + 1);` +
      ` out.count += 1;` +
      `}`
    );
    return aggregation;
  }
}

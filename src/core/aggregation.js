const KinveyError = require('./errors').KinveyError;
const Query = require('./query');
const clone = require('lodash/lang/clone');
const result = require('lodash/object/result');
const isObject = require('lodash/lang/isObject');
const isString = require('lodash/lang/isString');
const isFunction = require('lodash/lang/isFunction');
const privateAggregationSymbol = Symbol();

class PrivateAggregation {
  constructor() {
    this._query = null;
    this._initial = {};
    this._key = {};
    this._reduce = function() {}.toString();
  }

  by(field) {
    this._key[field] = true;
    return this;
  }

  initial(objectOrKey, value) {
    if (!value && !isObject(objectOrKey)) {
      throw new KinveyError('objectOrKey argument must be an Object.');
    }

    if (isObject(objectOrKey)) {
      this._initial = objectOrKey;
    } else {
      this._initial[objectOrKey] = value;
    }

    return this;
  }

  process(response) {
    if (!this._query) {
      return response;
    }

    return this._query.process(response);
  }

  query(query) {
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    this._query = query;
    return this;
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
      condition: this._query ? this._query.toJSON().filter : {}
    };

    return clone(json);
  }
}

class Aggregation {
  constructor() {
    this[privateAggregationSymbol] = new PrivateAggregation();
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
}

module.exports = Aggregation;

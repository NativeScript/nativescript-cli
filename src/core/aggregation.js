/**
 * Copyright 2014 Kinvey, Inc.
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

// Aggregation.
// ------------

// The `Kinvey.Group` class provides an easy way to build aggregations, which
// can then be passed to one of the REST API wrappers to group application
// data. Internally, the class builds a MongoDB aggregation.

/**
 * The `Kinvey.Group` class.
 *
 * @memberof! <global>
 * @class Kinvey.Group
 */
Kinvey.Group = function() {
  /**
   * The query applied to the result set.
   *
   * @private
   * @type {?Kinvey.Query}
   */
  this._query = null;

  /**
   * The initial structure of the document to be returned.
   *
   * @private
   * @type {Object}
   */
  this._initial = {};

  /**
   * The fields to group by.
   *
   * @private
   * @type {Object}
   */
  this._key = {};

  /**
   * The MapReduce function.
   *
   * @private
   * @type {string}
   */
  this._reduce = function() { }.toString();
};

// Define the aggregation methods.
Kinvey.Group.prototype = /** @lends Kinvey.Group# */{
  /**
   * Sets the field to group by.
   *
   * @param {string} field The field.
   * @returns {Kinvey.Group} The aggregation.
   */
  by: function(field) {
    this._key[field] = true;
    return this;
  },

  /**
   * Sets the initial structure of the document to be returned.
   *
   * @param {Object|string} objectOrKey The initial structure, or key to set.
   * @param {*} value [value] The value of `key`.
   * @throws {Kinvey.Error} `object` must be of type: `Object`.
   * @returns {Kinvey.Group} The aggregation.
   */
  initial: function(objectOrKey, value) {
    // Validate arguments.
    if('undefined' === typeof value && !isObject(objectOrKey)) {
      throw new Kinvey.Error('objectOrKey argument must be of type: Object.');
    }

    // Set or append the initial structure.
    if(isObject(objectOrKey)) {
      this._initial = objectOrKey;
    }
    else {
      this._initial[objectOrKey] = value;
    }
    return this;
  },

  /**
   * Post processes the raw response by applying sort, limit, and skip. These
   * modifiers are provided through the aggregation query.
   *
   * @param {Array} response The raw response.
   * @throws {Kinvey.Error} `response` must be of type: `Array`.
   * @returns {Array} The processed response.
   */
  postProcess: function(response) {
    // If there is a query, process it.
    if(null === this._query) {
      return response;
    }
    return this._query._postProcess(response);
  },

  /**
   * Sets the query to apply to the result set.
   *
   * @param {Kinvey.Query} query The query.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Kinvey.Group} The aggregation.
   */
  query: function(query) {
    // Validate arguments.
    if(!(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    this._query = query;
    return this;
  },

  /**
   * Sets the MapReduce function.
   *
   * @param {function|string} fn The function.
   * @throws {Kinvey.Error} `fn` must be of type: `function` or `string`.
   * @returns {Kinvey.Group} The aggregation.
   */
  reduce: function(fn) {
    // Cast arguments.
    if(isFunction(fn)) {
      fn = fn.toString();
    }

    // Validate arguments.
    if(!isString(fn)) {
      throw new Kinvey.Error('fn argument must be of type: function or string.');
    }

    this._reduce = fn;
    return this;
  },

  /**
   * Returns JSON representation of the aggregation.
   *
   * @returns {Object} JSON object-literal.
   */
  toJSON: function() {
    return {
      key       : this._key,
      initial   : this._initial,
      reduce    : this._reduce,
      condition : null !== this._query ? this._query.toJSON().filter : {}
    };
  }
};

// Pre-define a number of reduce functions. All return a preseeded
// `Kinvey.Group`.

/**
 * Counts all elements in the group.
 *
 * @memberof Kinvey.Group
 * @param {string} [field] The field, or `null` to perform a global count.
 * @returns {Kinvey.Group} The aggregation.
 */
Kinvey.Group.count = function(field) {
  // Return the aggregation.
  var agg = new Kinvey.Group();

  // If a field was specified, count per field.
  if(null != field) {
    agg.by(field);
  }

  agg.initial({ result: 0 });
  agg.reduce(function(doc, out) {
    out.result += 1;
  });
  return agg;
};

/**
 * Sums together the numeric values for the specified field.
 *
 * @memberof Kinvey.Group
 * @param {string} field The field.
 * @returns {Kinvey.Group} The aggregation.
 */
Kinvey.Group.sum = function(field) {
  // Escape arguments.
  field = field.replace('\'', '\\\'');

  // Return the aggregation.
  var agg = new Kinvey.Group();
  agg.initial({ result: 0 });
  agg.reduce('function(doc, out) { out.result += doc["' + field + '"]; }');
  return agg;
};

/**
 * Finds the minimum of the numeric values for the specified field.
 *
 * @memberof Kinvey.Group
 * @param {string} field The field.
 * @returns {Kinvey.Group} The aggregation.
 */
Kinvey.Group.min = function(field) {
  // Escape arguments.
  field = field.replace('\'', '\\\'');

  // Return the aggregation.
  var agg = new Kinvey.Group();
  agg.initial({ result: 'Infinity' });
  agg.reduce('function(doc, out) { out.result = Math.min(out.result, doc["' + field + '"]); }');
  return agg;
};

/**
 * Finds the maximum of the numeric values for the specified field.
 *
 * @memberof Kinvey.Group
 * @param {string} field The field.
 * @returns {Kinvey.Group} The aggregation.
 */
Kinvey.Group.max = function(field) {
  // Escape arguments.
  field = field.replace('\'', '\\\'');

  // Return the aggregation.
  var agg = new Kinvey.Group();
  agg.initial({ result: '-Infinity' });
  agg.reduce('function(doc, out) { out.result = Math.max(out.result, doc["' + field + '"]); }');
  return agg;
};

/**
 * Finds the average of the numeric values for the specified field.
 *
 * @memberof Kinvey.Group
 * @param {string} field The field.
 * @returns {Kinvey.Group} The aggregation.
 */
Kinvey.Group.average = function(field) {
  // Escape arguments.
  field = field.replace('\'', '\\\'');

  // Return the aggregation.
  var agg = new Kinvey.Group();
  agg.initial({ count: 0, result: 0 });
  agg.reduce(
    'function(doc, out) {' +
    '  out.result = (out.result * out.count + doc["' + field + '"]) / (out.count + 1);' +
    '  out.count += 1;' +
    '}'
  );
  return agg;
};

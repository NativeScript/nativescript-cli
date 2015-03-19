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

// Utils.
// ------

// Helper function to get and set a nested property in a document.
var nested = function(document, dotProperty, value) {
  if(!dotProperty) {// Top-level document.
    document = 'undefined' === typeof value ? document : value;
    return document;
  }

  var obj   = document;
  var parts = dotProperty.split('.');

  // Traverse the document until the nested property is located.
  var current;
  while((current = parts.shift()) && null != obj && obj.hasOwnProperty(current)) {
    if(0 === parts.length) {// Return the (new) property value.
      obj[current] = 'undefined' === typeof value ? obj[current] : value;
      return obj[current];
    }
    obj = obj[current];// Continue traversing.
  }
  return null;// Property not found.
};

// Use the fastest possible means to execute a task in a future turn of the
// event loop. Borrowed from [q](http://documentup.com/kriskowal/q/).
var nextTick;
if('function' === typeof root.setImmediate) {// IE10, Node.js 0.9+.
  nextTick = root.setImmediate;
}
else if('undefined' !== typeof process && process.nextTick) {// Node.js <0.9.
  nextTick = process.nextTick;
}
else {// Most browsers.
  nextTick = function(fn) {
    root.setTimeout(fn, 0);
  };
}

// Wraps asynchronous callbacks so they get called when a promise fulfills or
// rejects. The `success` and `error` properties are extracted from `options`
// at run-time, allowing intermediate process to alter the callbacks.
var wrapCallbacks = function(promise, options) {
  promise.then(function(value) {
    if(options.success) {// Invoke the success handler.
      options.success(value);
    }
  }, function(reason) {
    if(options.error) {// Invoke the error handler.
      options.error(reason);
    }
  }).then(null, function(err) {
    // If an exception occurs, the promise would normally catch it. Since we
    // are using asynchronous callbacks, exceptions should be thrown all the
    // way.
    nextTick(function() {
      throw err;
    });
  });
  return promise;
};

// Create helper functions that are used throughout the library. Inspired by
// [underscore.js](http://underscorejs.org/).
var isArray = Array.isArray || function(arg) {
  return '[object Array]' === Object.prototype.toString.call(arg);
};
var isFunction = function(fn) {
  if('function' !== typeof /./) {
    return 'function' === typeof fn;
  }
  return '[object Function]' === Object.prototype.toString.call(fn);
};
var isNumber = function(number) {
  return '[object Number]' === Object.prototype.toString.call(number) && !isNaN(number);
};
var isObject = function(obj) {
  return Object(obj) === obj;
};
var isRegExp = function(regExp) {
  return '[object RegExp]' === Object.prototype.toString.call(regExp);
};

var isString = function(str) {
  return '[object String]' === Object.prototype.toString.call(str);
};
var isEmptyString = String.isEmpty = function(str) {
  return isString(str) && (str.length === 0 || !str.trim());
};

var isEmpty = function(obj) {
  if(null == obj) {
    return true;
  }
  if(isArray(obj) || isString(obj)) {
    return 0 === obj.length;
  }
  for(var key in obj) {
    if(obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

// The library internals rely on adapters to implement certain functionalities.
// Adapters must implement these functionalities according to an interface. An
// adapter is applied to the internals through a `use` function.

// If no adapter is specified, the internals throw an error instead.
var methodNotImplemented = function(methodName) {
  return function() {
    throw new Kinvey.Error('Method not implemented: ' + methodName);
  };
};

// An adapter can be applied by a `use` function attached to an internal
// namespace. Adapters must implement the `nsInterface`.
var use = function(nsInterface) {
  return function(adapter) {
    var namespace = this;

    // Debug.
    if(KINVEY_DEBUG) {
      log('Applying an adapter.', namespace, adapter);
    }

    // Validate adapter.
    adapter = adapter || {};
    nsInterface.forEach(function(methodName) {
      if('function' !== typeof adapter[methodName]) {
        throw new Kinvey.Error('Adapter must implement method: ' + methodName);
      }
    });

    // Apply adapter to the internals.
    nsInterface.forEach(function(methodName) {
      namespace[methodName] = function() {
        // Ensure the adapter is used as `this` context.
        return adapter[methodName].apply(adapter, arguments);
      };
    });
  };
};

// Define the request Option type for documentation purposes.

/**
 * @typedef {Object} Options
 * @property {function} [error]        Failure callback.
 * @property {Array}    [exclude]      List of relational fields not to save.
 *             Use in conjunction with `save` or `update`.
 * @property {boolean}  [fallback]     Fallback to the network if the request
 *             failed locally. Use in conjunction with `offline`.
 * @property {Array}    [fields]       Fields to select.
 * @property {boolean}  [fileTls=true] Use the https protocol to communicate
 *             with GCS.
 * @property {integer}  [fileTtl]      A custom expiration time (in seconds).
 * @property {integer}  [maxAge]       Cache maxAge (in seconds).
 * @property {boolean}  [nocache=true] Use cache busting.
 * @property {boolean}  [offline]      Initiate the request locally.
 * @property {boolean}  [refresh]      Persist the response locally.
 * @property {Object}   [relations]    Map of relational fields to collections.
 * @property {boolean}  [skipBL]       Skip Business Logic. Use in conjunction
 *             with Master Secret.
 * @property {function} [success]      Success callback.
 * @property {integer}  [timeout]      The request timeout (ms).
 * @property {boolean}  [trace=false]  Add the request id to the error object
 *             for easy request tracking (in case of contacting support).
 */

// Define the `Storage` namespace, used to store application state.
/**
 * @private
 * @namespace Storage
 */
var Storage = /** @lends Storage */{
  /**
   * Prepares a deletion from storage.
   *
   * @param {string} key The key.
   * @returns {Promise}
   */
  destroy: function(key) {
    return Storage._destroy(Storage._key(key));
  },

  /**
   * Prepares a retrieval from storage.
   *
   * @param {string} key The key.
   * @returns {Promise}
   */
  get: function(key) {
    return Storage._get(Storage._key(key));
  },

  /**
   * Prepares a save to storage.
   *
   * @param {string} key The key.
   * @param {*} value The value.
   * @returns {Promise}
   */
  save: function(key, value) {
    return Storage._save(Storage._key(key), value);
  },

  /**
   * Deletes a value from storage.
   *
   * @private
   * @abstract
   * @method
   * @param {string} key The key.
   * @returns {Promise}
   */
  _destroy: methodNotImplemented('Storage.destroy'),

  /**
   * Retrieves a value from storage.
   *
   * @private
   * @abstract
   * @method
   * @param {string} key The key.
   * @returns {*} The value.
   * @returns {Promise}
   */
  _get: methodNotImplemented('Storage.get'),

  /**
   * Formats the key.
   *
   * @private
   * @param {string} key The key.
   * @returns {string} The formatted key.
   */
  _key: function(key) {
    // Namespace the key, so it is unique to the Kinvey application.
    return ['Kinvey', Kinvey.appKey, key].join('.');
  },

  /**
   * Saves a value to storage.
   *
   * @private
   * @abstract
   * @method
   * @param {string} key The key.
   * @param {*} value The value.
   */
  _save: methodNotImplemented('Storage.set'),

  /**
   * Sets the implementation of `Storage` to the specified adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Storage` interface.
   */
  use: use(['_destroy', '_get', '_save'])
};

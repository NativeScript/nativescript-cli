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

// Deferreds.
// ----------

// The library relies on deferreds for asynchronous communication. The internal
// implementation is defined by an adapter. Adapters must implement the
// [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/).

/**
 * @memberof! <global>
 * @namespace Kinvey.Defer
 */
Kinvey.Defer = /** @lends Kinvey.Defer */{
  /**
   * Turns an array of promises into a promise for an array. If any of the
   * promises gets rejected, the whole array is rejected immediately.
   *
   * @param {Promise[]} promises List of promises.
   * @throws {Kinvey.Error} `promises` must be of type: `Array`.
   * @returns {Promise} The promise.
   */
  all: function(promises) {
    var error;

    // Validate arguments.
    if(!isArray(promises)) {
      error = new Kinvey.Error('promises argument must be of type: Array.');
      return Kinvey.Defer.reject(error);
    }

    // If there are no promises, resolve immediately.
    var pending = promises.length;
    if(0 === pending) {
      return Kinvey.Defer.resolve([]);
    }

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // For every promise, add its value to the response if fulfilled. If all
    // promises are fulfilled, fulfill the array promise. If one of the members
    // fail, reject the array promise immediately.
    var response = [];
    promises.forEach(function(promise, index) {
      promise.then(function(value) {
        // Update counter and append response in-place.
        pending        -= 1;
        response[index] = value;

        // If all promises are fulfilled, fulfill the array promise.
        if(0 === pending) {
          deferred.resolve(response);
        }
      }, function(error) {// A member got rejected, reject the whole array.
        deferred.reject(error);
      });
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * Fulfills a promise immediately.
   *
   * @param {*} value The fulfillment value.
   * @returns {Promise} The promise.
   */
  resolve: function(value) {
    var deferred = Kinvey.Defer.deferred();
    deferred.resolve(value);
    return deferred.promise;
  },

  /**
   * Rejects a promise immediately.
   *
   * @param {*} reason The rejection reason.
   * @returns {Promise} The promise.
   */
  reject: function(reason) {
    var deferred = Kinvey.Defer.deferred();
    deferred.reject(reason);
    return deferred.promise;
  },

  /**
   * Creates a deferred (pending promise).
   *
   * @abstract
   * @method
   * @returns {Object} The deferred.
   */
  deferred: methodNotImplemented('Kinvey.Defer.deferred'),

  /**
   * Sets the implementation of `Kinvey.Defer` to the specified adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Kinvey.Defer` interface.
   */
  use: use(['deferred'])
};

// Define the Promise type for documentation purposes.

/**
 * @typedef {Object} Promise
 * @property {function} then The accessor to the current state or eventual
 *             fulfillment value or rejection reason.
 */

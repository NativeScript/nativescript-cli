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

// Persistence.
// ------------

// The library provides ways to store data in a variety of locations. By
// default, all data will be stored in the remote backend. However, the
// namespace below provides means to switch between the local (optionally
// read-only) and remote backend. The interface of all backends must follow
// CRUD for easy interoperability between backends.

// Define a function to merge user-defined persistence options with state as
// defined by `Kinvey.Sync`.
var persistenceOptions = function(options) {
  var isEnabled = Kinvey.Sync.isEnabled();
  var isOnline  = Kinvey.Sync.isOnline();
  options.fallback = isEnabled && isOnline && false !== options.fallback;
  options.offline  = isEnabled && (!isOnline || options.offline);
  options.refresh  = isEnabled && isOnline && false !== options.refresh;
  return options;
};

// Define a namespace to control local data expiration through a maxAge mechanism.
var maxAge = {
  /**
   * Adds maxAge metadata entries.
   *
   * @param {Array|Object} data List of objects.
   * @param {integer} [maxAge] maximum age (seconds).
   * @returns {Array|Object} Mutated list of objects.
   */
  addMetadata: function(data, maxAge) {
    var lastRefreshedAt = new Date().toISOString();
    var multi           = isArray(data);

    var response = multi ? data : [ data ];
    response = response.map(function(item) {
      if(null != item) {
        item._kmd                 = item._kmd || { };
        item._kmd.lastRefreshedAt = lastRefreshedAt;
        if(null != maxAge) {
          item._kmd.maxAge = maxAge;
        }
      }
      return item;
    });
    return multi ? response : response[0];
  },

  /**
   * Removes maxAge metadata entries.
   *
   * @param {Array|Object} data List of objects.
   * @returns {Array|Object} Mutated list of objects.
   */
  removeMetadata: function(data) {
    var multi    = isArray(data);
    var response = multi ? data : [ data ];
    response = response.map(function(item) {
      if(null != item && null != item._kmd) {
        delete item._kmd.lastRefreshedAt;
        delete item._kmd.maxAge;
      }
      return item;
    });
    return multi ? response : response[0];
  },

  /**
   * Returns data maxAge status.
   *
   * @param {Array|Object} data List of objects.
   * @param {integer} [maxAge] Maximum age (optional).
   * @returns {boolean|Object} Status, or object if refresh is needed.
   * @throws {Kinvey.Error} The item does not have _kmd defined as a property.
   *                        It is required to get the maxAge status.
   */
  status: function(data, maxAge) {
    var needsRefresh = false;
    var response     = isArray(data) ? data : [ data ];

    var length = response.length;
    var now    = new Date().getTime();
    for(var i = 0; i < length; i += 1) {
      var item = response[i];

      // Check if item has property _kmd
      if (item._kmd == null) {
        var error = new Kinvey.Error('The item does not have _kmd defined as a property.' +
                                     'It is required to get the maxAge status.');
        throw error;
      }

      if (null != item && null != item._kmd && null != item._kmd.lastRefreshedAt) {
        var itemMaxAge       = (maxAge || item._kmd.maxAge) * 1000;// Milliseconds.
        var lastRefreshedAt  = fromISO(item._kmd.lastRefreshedAt).getTime();
        var threshold        = lastRefreshedAt + itemMaxAge;

        // Verify time.
        if(now > threshold) {
          return false;
        }

        // Verify whether refresh is required.
        var refreshThreshold = lastRefreshedAt + itemMaxAge * 0.9;// 90%
        if(now > refreshThreshold) {
          needsRefresh = true;
        }
      }
    }
    return needsRefresh ? { refresh: true } : true;
  }
};

/**
 * @private
 * @memberof! <global>
 * @namespace Kinvey.Persistence
 */
Kinvey.Persistence = /** @lends Kinvey.Persistence */{
  /**
   * Performs a create operation.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  create: function(request, options) {
    // Add support for references.
    if(options.relations) {
      var collection = USERS === request.namespace ? USERS : request.collection;
      return KinveyReference.save(collection, request.data, options);
    }

    // Cast arguments.
    request.local = request.local || {};
    options       = persistenceOptions(options);

    // If `options.offline`, use local.
    if(request.local.req && options.offline) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Using local persistence.');
      }

      return Kinvey.Persistence.Local.create(request, options).then(null, function(error) {
        // On rejection, if `options.fallback`, perform aggregation requests
        // against net.
        if(options.fallback && '_group' === request.id) {
          // Debug.
          if(KINVEY_DEBUG) {
            log('Local persistence failed. Use net persistence because of the fallback flag.');
          }

          options.offline = false;// Overwrite to avoid infinite recursion.
          return Kinvey.Persistence.create(request, options);
        }
        return Kinvey.Defer.reject(error);
      });
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Using net persistence.');
    }

    // Use net. If `options.refresh`, persist the response locally.
    var promise = Kinvey.Persistence.Net.create(request, options);
    if(request.local.res && options.refresh) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Persisting the response locally.');
      }

      return promise.then(function(response) {
        // The request `data` is the response from the network.
        request.data = response;
        return Kinvey.Persistence.Local.create(request, options).then(function() {
          // Return the original response.
          return response;
        });
      });
    }
    return promise;
  },

  /**
   * Performs a read operation.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  read: function(request, options) {
    // Cast arguments.
    request.local = request.local || {};
    options       = persistenceOptions(options);

    // If `options.offline`, use local.
    if(request.local.req && options.offline) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Using local persistence.');
      }

      return Kinvey.Persistence.Local.read(request, options).then(null, function(error) {
        // On rejection, if `options.fallback`, perform the request against
        // net.
        if(options.fallback) {
          // Debug.
          if(KINVEY_DEBUG) {
            log('Local persistence failed. Use net persistence because of the fallback flag.');
          }

          options.offline = false;// Overwrite to avoid infinite recursion.
          return Kinvey.Persistence.read(request, options);
        }
        return Kinvey.Defer.reject(error);
      });
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Using net persistence.');
    }

    // Use net.
    var promise = Kinvey.Persistence.Net.read(request, options);

    // If `options.refresh`, and field selection was *not* used, persist the response locally.
    var fieldSelection = options.fields || (request.query && !isEmpty(request.query._fields));
    if(request.local.res && options.refresh && !fieldSelection) {
      return promise.then(function(response) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('Persisting the response locally.');
        }

        // Add support for references.
        var promise;
        if(options.relations) {
          var offline     = options.offline;
          options.offline = true;// Force local persistence.
          options.track   = false;// The documents are not subject to synchronization.
          var collection  = USERS === request.namespace ? USERS : request.collection;
          promise = KinveyReference.save(collection, response, options).then(function() {
            // Restore the options.
            options.offline = offline;
            delete options.track;
          });
        }
        else {// Save at once.
          request.data = response;// The request data is the network response.
          promise = Kinvey.Persistence.Local.create(request, options);
        }

        // Return the original response.
        return promise.then(function() {
          return response;
        });
      }, function(error) {
        // If `ENTITY_NOT_FOUND`, persist the response locally by initiating a
        // delete request locally.
        if(Kinvey.Error.ENTITY_NOT_FOUND === error.name) {
          return Kinvey.Persistence.Local.destroy(request, options).then(function() {
            // Return the original response.
            return Kinvey.Defer.reject(error);
          });
        }
        return Kinvey.Defer.reject(error);
      });
    }
    return promise;
  },

  /**
   * Performs an update operation.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  update: function(request, options) {
    // Add support for references.
    if(options.relations) {
      var collection = USERS === request.namespace ? USERS : request.collection;
      return KinveyReference.save(collection, request.data, options);
    }

    // Cast arguments.
    request.local = request.local || {};
    options       = persistenceOptions(options);

    // If `options.offline`, use local.
    if(request.local.req && options.offline) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Using local persistence.');
      }

      return Kinvey.Persistence.Local.update(request, options);
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Using net persistence..');
    }

    // Use net. If `options.refresh`, persist the response locally.
    var promise = Kinvey.Persistence.Net.update(request, options);
    if(request.local.res && options.refresh) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Persisting the response locally.');
      }

      return promise.then(function(response) {
        // The request `data` is the response from the network.
        request.data = response;
        return Kinvey.Persistence.Local.update(request, options).then(function() {
          // Return the original response.
          return response;
        });
      });
    }
    return promise;
  },

  /**
   * Performs a delete operation.
   *
   * @param {Request} request The request.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  destroy: function(request, options) {
    // Cast arguments.
    request.local = request.local || {};
    options       = persistenceOptions(options);

    // If `options.offline`, use local.
    if(request.local.req && options.offline) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Using local persistence.');
      }

      return Kinvey.Persistence.Local.destroy(request, options);
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Using net persistence.');
    }

    // Use net. If `options.refresh`, persist the response locally.
    var promise = Kinvey.Persistence.Net.destroy(request, options);
    if(request.local.res && options.refresh) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Persisting the response locally.');
      }

      return promise.then(function(response) {
        // Initiate the same request against local.
        return Kinvey.Persistence.Local.destroy(request, options).then(function() {
          // Return the original response.
          return response;
        }, function(error) {
          // If `ENTITY_NOT_FOUND`, the local database was already up-to-date.
          if(Kinvey.Error.ENTITY_NOT_FOUND === error.name) {
            // Return the original response.
            return response;
          }
          return Kinvey.Defer.reject(error);
        });
      });
    }
    return promise;
  }
};

// Define the Request type for documentation purposes.

/**
 * @private
 * @typedef {Object} Request
 * @property {string}       namespace    Namespace.
 * @property {string}       [collection] The collection.
 * @property {string}       [id]         The id.
 * @property {Kinvey.Query} [query]      Query.
 * @property {Object}       [flags]      Flags.
 * @property {*}            [data]       Data.
 * @property {function}     auth         Authentication.
 * @property {Object}       [local]      Cacheability of the request.
 * @property {boolean}      [local.req]  The request is executable locally.
 * @property {boolean}      [local.res]  The response is persistable locally.
 */

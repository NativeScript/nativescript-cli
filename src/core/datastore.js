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

// Data Store.
// -----------

// REST API wrapper for data storage.

/**
 * @memberof! <global>
 * @namespace Kinvey.DataStore
 */
Kinvey.DataStore = /** @lends Kinvey.DataStore */{
  /**
   * Retrieves all documents matching the provided query.
   *
   * @param {string} collection Collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} A list of documents.
   */
  find: function(collection, query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving documents by query.', arguments);
    }

    // Validate arguments.
    if(null != query && !(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace  : DATA_STORE,
      collection : collection,
      query      : query,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved the documents by query.', response);
      }, function(error) {
        log('Failed to retrieve the documents by query.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Retrieves a document.
   *
   * @param {string} collection Collection.
   * @param {string} id Document id.
   * @param {Options} [options] Options.
   * @returns {Promise} The document.
   */
  get: function(collection, id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving a document.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace  : DATA_STORE,
      collection : collection,
      id         : id,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved the document.', response);
      }, function(error) {
        log('Failed to retrieve the document.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Saves a (new) document.
   *
   * @param {string} collection Collection.
   * @param {Object} document Document.
   * @param {Options} [options] Options.
   * @returns {Promise} The new document.
   */
  save: function(collection, document, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Saving a (new) document.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // If the document has an `_id`, perform an update instead.
    if(null != document._id) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('The document has an _id, updating instead.', arguments);
      }

      return Kinvey.DataStore.update(collection, document, options);
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace  : DATA_STORE,
      collection : collection,
      data       : document,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Saved the new document.', response);
      }, function(error) {
        log('Failed to save the new document.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Updates an existing document. If the document does not exist, however, it
   * is created.
   *
   * @param {string} collection Collection.
   * @param {Object} document Document.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `document` must contain: `_id`.
   * @returns {Promise} The (new) document.
   */
  update: function(collection, document, options) {
    var error;

    // Debug.
    if(KINVEY_DEBUG) {
      log('Updating a document.', arguments);
    }

    // Validate arguments.
    if(null == document._id) {
      error = new Kinvey.Error('document argument must contain: _id');
      return Kinvey.Defer.reject(error);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.update({
      namespace  : DATA_STORE,
      collection : collection,
      id         : document._id,
      data       : document,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Updated the document.', response);
      }, function(error) {
        log('Failed to update the document.', error);
      });
    }

    promise.then(null, function(err) {
      console.log(err);
    });

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Deletes all documents matching the provided query.
   *
   * @param {string} collection Collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} The response.
   */
  clean: function(collection, query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Deleting documents by query.', arguments);
    }

    // Cast and validate arguments.
    options = options || {};
    query   = query   || new Kinvey.Query();
    if(!(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.destroy({
      namespace  : DATA_STORE,
      collection : collection,
      query      : query,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Deleted the documents.', response);
      }, function(error) {
        log('Failed to delete the documents.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Deletes a document.
   *
   * @param {string} collection Collection.
   * @param {string} id Document id.
   * @param {Options} [options] Options.
   * @param {boolean} [options.silent=false] Succeed if the document did not
   *          exist prior to deleting.
   * @returns {Promise} The response.
   */
  destroy: function(collection, id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Deleting a document.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.destroy({
      namespace  : DATA_STORE,
      collection : collection,
      id         : id,
      auth       : Auth.Default,
      local      : { req: true, res: true }
    }, options).then(null, function(error) {
      // If `options.silent`, treat `ENTITY_NOT_FOUND` as success.
      if(options.silent && Kinvey.Error.ENTITY_NOT_FOUND === error.name) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('The document does not exist. Returning success because of the silent flag.');
        }

        return { count: 0 };// The response.
      }
      return Kinvey.Defer.reject(error);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Deleted the document.', response);
      }, function(error) {
        log('Failed to delete the document.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Performs a count operation.
   *
   * @param {string} collection The collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} The response.
   */
  count: function(collection, query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Counting the number of documents.', arguments);
    }

    // Validate arguments.
    if(null != query && !(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace  : DATA_STORE,
      collection : collection,
      id         : '_count',
      query      : query,
      auth       : Auth.Default,
      local      : { req: true }
    }, options).then(function(response) {
      return response.count;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Counted the number of documents.', response);
      }, function(error) {
        log('Failed to count the number of documents.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Performs a group operation.
   *
   * @param {string} collection The collection.
   * @param {Kinvey.Aggregation} aggregation The aggregation.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `aggregation` must be of type `Kinvey.Group`.
   * @returns {Promise} The response.
   */
  group: function(collection, aggregation, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Grouping documents', arguments);
    }

    // Validate arguments.
    if(!(aggregation instanceof Kinvey.Group)) {
      throw new Kinvey.Error('aggregation argument must be of type: Kinvey.Group.');
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace  : DATA_STORE,
      collection : collection,
      id         : '_group',
      data       : aggregation.toJSON(),
      auth       : Auth.Default,
      local      : { req: true }
    }, options).then(function(response) {
      // Process the raw response.
      return aggregation.postProcess(response);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Grouped the documents.', response);
      }, function(error) {
        log('Failed to group the documents.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  }
};

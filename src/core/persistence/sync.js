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

// Synchronization.
// ----------------

// Synchronization consists of two major namespaces: `Sync` and `Kinvey.Sync`.
// The former contains the synchronization code, as well as multiple properties
// used to maintain the application state throughout its lifetime. The
// `Kinvey.Sync` namespace exposes a number of methods to the outside world.
// Most of these methods delegate back to `Sync`. Therefore, `Kinvey.Sync`
// provides the public interface for synchronization.

/**
 * @private
 * @namespace Sync
 */
var Sync = /** @lends Sync */{
  /**
   * Flag whether local persistence is enabled.
   *
   * @type {boolean}
   */
  enabled: false,

  /**
   * Flag whether the application resides in an online state.
   *
   * @type {boolean}
   */
  online: true,

  /**
   * The identifier where the synchronization metadata is stored.
   *
   * @type {string}
   */
  system: 'system.sync',

  /**
   * Counts the number of documents pending synchronization. If `collection` is
   * provided, it returns the count of that collection only.
   *
   * @param {string} [collection] The collection.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  count: function(collection, options) {
    // Cast arguments.
    options = options || {};

    // If a collection was provided, count that collection only.
    if(null != collection) {
      return Database.get(Sync.system, collection, options).then(function(response) {
        // Return the count.
        return response.size;
      }, function(error) {
        // If `ENTITY_NOT_FOUND`, there are no documents pending
        // synchronization.
        if(Kinvey.Error.ENTITY_NOT_FOUND === error.name) {
          return 0;
        }
        return Kinvey.Defer.reject(error);
      });
    }

    // Aggregate the count of all collections.
    var agg = Kinvey.Group.sum('size').toJSON();
    return Database.group(Sync.system, agg, options).then(function(response) {
      // Return the aggregation result, or 0 if the aggregation was empty.
      return response[0] ? response[0].result : 0;
    });
  },

  /**
   * Initiates a synchronization operation.
   *
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  execute: function(options) {
    // Obtain all the collections that need to be synchronized.
    var query = new Kinvey.Query().greaterThan('size', 0);
    return Database.find(Sync.system, query, options).then(function(response) {
      // Synchronize all the collections in parallel.
      var promises = response.map(function(collection) {
        return Sync._collection(collection._id, collection.documents, options);
      });
      return Kinvey.Defer.all(promises);
    });
  },

  /**
   * Handler to flag the provided `documents` for synchronization.
   *
   * @param {string} collection The collection.
   * @param {Array|Object} documents The document, or list of documents.
   * @param {Options} [options] Options.
   * @returns {Promise} The promise.
   */
  notify: function(collection, documents, options) {
    var error;

    // Update the metadata for the provided collection in a single transaction.
    return Database.findAndModify(Sync.system, collection, function(metadata) {
      // Cast arguments.
      documents = isArray(documents) ? documents : [ documents ];
      metadata  = metadata || { _id: collection, documents: {}, size: 0 };

      // Add each document to the metadata ( id => timestamp ).
      documents.forEach(function(document) {
        // Check document for property _id. Thrown error will reject promise.
        if (document._id == null) {
          error = new Kinvey.Error('Document does not have _id property defined. ' +
                                   'It is required to do proper synchronization.');
          throw error;
        }

        if(!metadata.documents.hasOwnProperty(document._id)) {
          metadata.size += 1;
        }

        // Get metadata for the doucment.
        var timestamp = null != document._kmd ? document._kmd.lmt : null;
        var clientAppVersion = options.clientAppVersion || Kinvey.ClientAppVersion.stringValue(),
            customRequestProperties = options.customRequestProperties || {};

        // Get globally set custom request properties.
        var globalCustomRequestProperties = Kinvey.CustomRequestProperties.properties();

        // If any custom request properties exist globally, merge them into the
        // custom request properties for this document. Only global custom request
        // properties that don't already exist for this document will be added.
        // Global request properties do NOT overwrite existing custom request
        // properties for the document.
        if (globalCustomRequestProperties != null) {
          Object.keys(globalCustomRequestProperties).forEach(function(name) {
            // If the property is not already set then set it
            if (!customRequestProperties.hasOwnProperty(name)) {
              customRequestProperties[name] = globalCustomRequestProperties[name];
            }
          });
        }

        // Store the metadata.
        metadata.documents[document._id] = {
          timestamp: timestamp,
          clientAppVersion: clientAppVersion,
          customRequestProperties: customRequestProperties
        };
      });

      // Return the new metadata.
      return metadata;
    }, options).then(function() {
      // Return an empty response.
      return null;
    });
  },

  /**
   * Synchronizes the provided collection.
   *
   * @private
   * @param {string} collection The collection.
   * @param {Object} documents Object of documents ( id => timestamp ).
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  _collection: function(collection, documents, options) {
    // Prepare the response.
    var result = { collection: collection, success: [], error: [] };
    var identifiers = Object.keys(documents);

    // Read the documents
    return Sync._read(collection, documents, options).then(function(response) {
      // Step 2: categorize the documents in the collection.
      var promises = identifiers.map(function(id) {
        var document = documents[id] || {};
        var metadata = {
          id: id,
          timestamp: document.timestamp,
          clientAppVersion: document.clientAppVersion,
          customRequestProperties: document.customRequestProperties
        };
        return Sync._document(
          collection,
          metadata,                   // The document metadata.
          response.local[id] || null, // The local document.
          response.net[id]   || null, // The net document.
          options
        ).then(null, function(response) {
          // Rejection occurs when a conflict could not be resolved. Append the
          // id to the errors, and resolve.
          result.error.push(response.id);
          return null;
        });
      });
      return Kinvey.Defer.all(promises);
    }).then(function(responses) {
      // Step 3: commit the documents in the collection.
      var created = responses.filter(function(response) {
        return null != response && null !== response.document;
      });
      var destroyed = responses.filter(function(response) {
        return null != response && null === response.document;
      });

      // Save and destroy all documents in parallel.
      var promises = [
        Sync._save(collection, created, options),
        Sync._destroy(collection, destroyed, options)
      ];
      return Kinvey.Defer.all(promises);
    }).then(function(responses) {
      // Merge the response.
      result.success = result.success.concat(responses[0].success, responses[1].success);
      result.error   = result.error.concat(responses[0].error, responses[1].error);

      // Step 4: update the metadata.
      return Database.findAndModify(Sync.system, collection, function(metadata) {
        // Remove each document from the metadata.
        result.success.forEach(function(id) {
          if(metadata.documents.hasOwnProperty(id)) {
            metadata.size -= 1;
            delete metadata.documents[id];
          }
        });

        // Return the new metadata.
        return metadata;
      }, options);
    }).then(function() {
      //console.log(result);
      // Step 5: return the synchronization result.
      return result;
    });
  },

  /**
   * Reads the provided documents using both local and network persistence.
   *
   * @private
   * @param {string} collection The collection.
   * @param {Array} documents List of documents.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  _read: function(collection, documents, options) {
    var identifiers = Object.keys(documents);
    var promises = identifiers.map(function(id) {
      var metadata = documents[id];
      var requestOptions = options || {};

      // Set options.clientAppVersion based on the metadata for the document
      requestOptions.clientAppVersion = metadata != null && metadata.clientAppVersion != null ? metadata.clientAppVersion : null;

      // Set options.customRequestProperties based on the metadata
      // for the document
      requestOptions.customRequestProperties = metadata != null && metadata.customRequestProperties != null ?
                                               metadata.customRequestProperties : null;

      // Build the request.
      var request = {
        namespace  : USERS === collection ? USERS : DATA_STORE,
        collection : USERS === collection ? null  : collection,
        query      : new Kinvey.Query().contains('_id', [id]),
        auth       : Auth.Default
      };

      // Read from local and net in parallel.
      return Kinvey.Defer.all([
        Kinvey.Persistence.Local.read(request, requestOptions),
        Kinvey.Persistence.Net.read(request, requestOptions)
      ]).then(function(responses) {
        return { local: responses[0], net: responses[1] };
      });
    });

    return Kinvey.Defer.all(promises).then(function(responses) {
      var response = { local: {}, net: {} };
      var error;

      responses.forEach(function(composite) {
        var locals = composite.local;
        var nets = composite.net;

        locals.forEach(function(document) {
          // Check document for property _id. Thrown error will reject promise.
          if (document._id == null) {
            error = new Kinvey.Error('Document does not have _id property defined. ' +
                                     'It is required to do proper synchronization.');
            throw error;
          }

          response.local[document._id] = document;
        });
        nets.forEach(function(document) {
          // Check document for property _id. Thrown error will reject promise.
          if (document._id == null) {
            error = new Kinvey.Error('Document does not have _id property defined. ' +
                                     'It is required to do proper synchronization.');
            throw error;
          }

          response.net[document._id] = document;
        });
      });

      return response;
    });
  },

  /**
   * Deletes the provided documents using both local and network persistence.
   *
   * @private
   * @param {string} collection The collection.
   * @param {Array} documents List of documents.
   * @param {Options} [options] Options.
   * @returns {Array} List of document ids.
   */
  _destroy: function(collection, documents, options) {
    var promises = documents.map(function(composite) {
      var id = composite.id;
      var metadata = composite.metadata;
      var requestOptions = options || {};

      // Set options.clientAppVersion based on the metadata for the document
      requestOptions.clientAppVersion = metadata.clientAppVersion != null ? metadata.clientAppVersion : null;

      // Set options.customRequestProperties based on the metadata
      // for the document
      requestOptions.customRequestProperties = metadata.customRequestProperties != null ?
                                               metadata.customRequestProperties : null;

      // Build the request.
      var request = {
        namespace  : USERS === collection ? USERS : DATA_STORE,
        collection : USERS === collection ? null  : collection,
        query      : new Kinvey.Query().contains('_id', [id]),
        auth       : Auth.Default
      };

      // Delete from local and net in parallel. Deletion is an atomic action,
      // therefore the documents will either all be part of `success` or `error`.
      var promises = [
        Kinvey.Persistence.Local.destroy(request, requestOptions),
        Kinvey.Persistence.Net.destroy(request, requestOptions)
      ];

      return Kinvey.Defer.all(promises).then(function() {
        return { success: [id], error: [] };
      }, function() {
        return { success: [], error: [id] };
      });
    });

    // Return one result for all the delete requests
    return Kinvey.Defer.all(promises).then(function(responses) {
      var result = { success: [], error: [] };

      responses.forEach(function(response) {
        result.success = result.success.concat(response.success);
        result.error = result.error.concat(response.error);
      });

      return result;
    });
  },

  /**
   * Compares the local and net versions of the provided document. Fulfills
   * with the winning document, or rejects if no winner can be picked.
   *
   * @private
   * @param {string} collection The collection.
   * @param {Object} metadata The document metadata.
   * @param {?Object} local The local document.
   * @param {?Object} net The net document.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  _document: function(collection, metadata, local, net, options) {
    var error;

    // Check if metadata is provided
    if (metadata == null) {
      error = new Kinvey.Error('Missing required metadata for the document in collection ' +
                               collection + '. This is required to properly sync.');
      return Kinvey.Defer.reject(error);
    }

    // Check if metadata has id property.
    if (metadata.id == null) {
      error = new Kinvey.Error('Metadata does not have id defined. This is ' +
                               'required to properly sync the document in collection ' +
                               collection + '.');
      return Kinvey.Defer.reject(error);
    }

    // Resolve if the remote copy does not exist or if both timestamps match.
    // Reject otherwise.
    if(null === net || (null != net._kmd && metadata.timestamp === net._kmd.lmt)) {
      return Kinvey.Defer.resolve({ id: metadata.id, document: local, metadata: metadata });
    }

    // A conflict was detected. Attempt to resolve it by invoking the conflict
    // handler.
    if(null != options.conflict) {
      // The conflict handler should return a promise which either resolves
      // with the winning document, or gets rejected.
      return options.conflict(collection, local, net).then(function(document) {
        return { id: metadata.id, document: document, metadata: metadata };
      }, function() {
        return Kinvey.Defer.reject({ id: metadata.id, document: [ local, net ], metadata: metadata });
      });
    }
    return Kinvey.Defer.reject({ id: metadata.id, document: [ local, net ], metadata: metadata });
  },

  /**
   * Saves the provided documents using both local and network persistence.
   *
   * @private
   * @param {string} collection The collection.
   * @param {Array} documents List of documents.
   * @param {Options} [options] Options.
   * @returns {Array} List of document ids.
   */
  _save: function(collection, documents, options) {
    // Save documents on net.
    var error    = [];// Track errors of individual update operations.
    var promises = documents.map(function(composite) {
      var document = composite.document;
      var metadata = composite.metadata;
      var requestOptions = options || {};

      // Set requestOptions.appVersion based on the metadata for the document
      requestOptions.clientAppVersion = metadata.clientAppVersion != null ? metadata.clientAppVersion : null;

      // Set requestOptions.customRequestProperties based on the metadata
      // for the document
      requestOptions.customRequestProperties = metadata.customRequestProperties != null ?
                                        metadata.customRequestProperties : null;

      return Kinvey.Persistence.Net.update({
        namespace  : USERS === collection ? USERS : DATA_STORE,
        collection : USERS === collection ? null  : collection,
        id         : document._id,
        data       : document,
        auth       : Auth.Default
      }, requestOptions).then(null, function() {
        // Rejection should not break the entire synchronization. Instead,
        // append the document id to `error`, and resolve.
        error.push(document._id);
        return null;
      });
    });
    return Kinvey.Defer.all(promises).then(function(responses) {
      // `responses` is an `Array` of documents. Batch save all documents.
      return Kinvey.Persistence.Local.create({
        namespace  : USERS === collection ? USERS : DATA_STORE,
        collection : USERS === collection ? null  : collection,
        data       : responses,
        auth       : Auth.Default
      }, options);
    }).then(function(response) {
      // Build the final response.
      return {
        success: response.map(function(document) {
          return document._id;
        }),
        error: error
      };
    }, function() {
      // Build the final response.
      return {
        success: [],
        error: documents.map(function(document) {
          return document._id;
        })
      };
    });
  }
};

// Expose public methods of `Sync` as the `Kinvey.Sync` namespace.

/**
 * @memberof! <global>
 * @namespace Kinvey.Sync
 */
Kinvey.Sync = /** @lends Kinvey.Sync */{
  /**
   * Counts the number of documents pending synchronization. If `collection` is
   * provided, it returns the count of that collection only.
   *
   * @param {string} [collection] The collection.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  count: function(collection, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Counting the number of documents pending synchronization.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Sync.count(collection, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Counted the number of documents pending synchronization.', response);
      }, function(error) {
        log('Failed to count the number of documents pending synchronization.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Deletes the local database, and will reset any synchronization
   * housekeeping.
   *
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  destruct: function(options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Deleting the local database.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Database.destruct(options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Deleted the local database.', response);
      }, function(error) {
        log('Failed to delete the local database.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Initiates a synchronization operation.
   *
   * @param {Options}  [options]          Options.
   * @param {function} [options.conflict] The conflict handler.
   * @param {Object}   [options.user]     Login with these credentials prior
   *          to initiating the synchronization operation.
   * @returns {Promise} The response.
   */
  execute: function(options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Synchronizing the application.', arguments);
    }

    // Validate preconditions.
    if(!Kinvey.Sync.isOnline()) {
      var error = clientError(Kinvey.Error.SYNC_ERROR, {
        debug: 'Sync is not enabled, or the application resides in offline mode.'
      });
      return Kinvey.Defer.reject(error);
    }

    // Cast arguments.
    options = options || {};

    // Attempt to login with the user context prior to synchronizing.
    var promise;
    if(null != options.user) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Attempting to login with a user context.', options.user);
      }

      // Prepare the response.
      promise = Kinvey.User.login(options.user).then(function() {
        // The user is now logged in. Re-start the synchronization operation.
        delete options.user;// We don’t need this anymore.
        return Kinvey.Sync.execute(options);
      });

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(null, function(error) {
          log('Failed to login with the user context.', error);
        });
      }

      // Return the response.
      delete options.success;
      return wrapCallbacks(promise, options);
    }

    // Prepare the response.
    promise = Sync.execute(options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Synchonized the application.', response);
      }, function(error) {
        log('Failed to synchronize the application.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Initializes the synchronization namespace.
   *
   * @param {Object}  [options]              Options.
   * @param {boolean} [options.enable=false] Enable local persistence.
   * @param {boolean} [options.online]       The initial application state.
   * @returns {Promise} The promise.
   */
  init: function(options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Initializing the synchronization functionality.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Save applicable options.
    Sync.enabled = null != options ? options.enable : false;
    Sync.online  = 'undefined' !== typeof options.online ? options.online : Sync.online;

    // Resolve immediately.
    return Kinvey.Defer.resolve(null);
  },

  /**
   * Returns whether local persistence is active.
   *
   * @returns {boolean} The enable status.
   */
  isEnabled: function() {
    return Sync.enabled;
  },

  /**
   * Returns whether the application resides in an online state.
   *
   * @returns {boolean} The online status.
   */
  isOnline: function() {
    return Sync.online;
  },

  /**
   * Switches the application state to offline.
   *
   * @returns {Promise} The promise.
   */
  offline: function() {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Switching the application state to offline.');
    }

    // Validate preconditions.
    if(!Kinvey.Sync.isEnabled()) {
      var error = clientError(Kinvey.Error.SYNC_ERROR, {
        debug: 'Sync is not enabled.'
      });
      return Kinvey.Defer.reject(error);
    }

    // Flip flag.
    Sync.online = false;

    // Resolve immediately.
    return Kinvey.Defer.resolve(null);
  },

  /**
   * Switches the application state to online.
   *
   * @param {Options} [options]           Options.
   * @param {boolean} [options.sync=true] Initiate a synchronization operation
   *          on mode change.
   * @returns {Promise} The response.
   */
  online: function(options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Switching the application state to online.', arguments);
    }

    // Validate preconditions.
    if(!Kinvey.Sync.isEnabled()) {
      var error = clientError(Kinvey.Error.SYNC_ERROR, {
        debug: 'Sync is not enabled.'
      });
      return Kinvey.Defer.reject(error);
    }

    // Cast arguments.
    options = options || {};

    // Flip flag.
    var previous = Sync.online;
    Sync.online  = true;

    // Initiate a synchronization operation if the mode changed.
    if(false !== options.sync && previous !== Sync.online) {
      return Kinvey.Sync.execute(options);
    }
    return Kinvey.Defer.resolve(null);
  },

  /**
   * Prefers the local document over the net document.
   *
   * @param {string} collection The collection.
   * @param {?Object} local The local document.
   * @param {?Object} net The net document.
   * @returns {Promise} The winning document.
   */
  clientAlwaysWins: function(collection, local) {
    return Kinvey.Defer.resolve(local);
  },

  /**
   * Prefers the net document over the local document.
   *
   * @param {string} collection The collection.
   * @param {?Object} local The local document.
   * @param {?Object} net The net document.
   * @returns {Promise} The winning document.
   */
  serverAlwaysWins: function(collection, local, net) {
    return Kinvey.Defer.resolve(net);
  }
};

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

/* jshint evil: true */

// `Database` adapter for [IndexedDB](http://www.w3.org/TR/IndexedDB/).
var IDBAdapter = {
  /**
   * The reference to an opened instance of IndexedDB.
   *
   * @type {IDBRequest}
   */
  db: null,

  /**
   * Returns the database name.
   *
   * @throws {Kinvey.Error} `Kinvey.appKey` must not be `null`.
   * @returns {string} The database name.
   */
  dbName: function() {
    // Validate preconditions.
    if(null == Kinvey.appKey) {
      throw new Kinvey.Error('Kinvey.appKey must not be null.');
    }
    return 'Kinvey.' + Kinvey.appKey;
  },

  /**
   * Constant object ID prefix for prepended to object IDs
   * created locally.
   *
   * @type {String}
   */
  objectIdPrefix: 'temp_',

  /**
   * The reference to the underlying IndexedDB implementation.
   *
   * @type {IDBFactory}
   */
  impl: root.indexedDB || root.webkitIndexedDB || root.mozIndexedDB ||
        root.oIndexedDB || root.msIndexedDB,

  /**
   * Status whether the database is currently performing an upgrade operation.
   *
   * @type {boolean}
   */
  inTransaction: false,

  /**
   * Generates an object id.
   *
   * @param {integer} [length=24] The length of the object id.
   * @returns {string} The id.
   */
  objectID: function(length) {
    length = length || 24;
    var chars = 'abcdef0123456789';
    var result = '';
    for(var i = 0, j = chars.length; i < length; i += 1) {
      var pos = Math.floor(Math.random() * j);
      result += chars.substring(pos, pos + 1);
    }
    result = IDBAdapter.objectIdPrefix + result;
    return result;
  },

  /**
   * Check if an object ID was created offline as a
   * temporary object ID.
   *
   * @param  {String}  id The object ID.
   * @return {Boolean}    True of false if the object ID is temporary.
   */
  isTemporaryObjectID: function(id) {
    if (id != null) {
      return id.indexOf(IDBAdapter.objectIdPrefix) === 0;
    }

    return false;
  },

  /**
   * A list of operations queued while the database was `inTransaction`.
   *
   * @type {Array.<function>}
   */
  pending: [],

  /**
   * Obtains a transaction handle to the provided collection.
   * NOTE IndexedDB automatically commits transactions that haven’t been used
   * in an event loop tick. Therefore, deferreds cannot be used. See
   * https://github.com/promises-aplus/promises-spec/issues/45.
   *
   * @param {string} collection The collection.
   * @param {boolean} [write=false] `true` to request write access in addition
   *                    to read.
   * @param {function} success Success callback.
   * @param {function} error Failure callback.
   * @param {boolean} [force=false] Continue even if a concurrent transaction
   *          is active.
   */
  transaction: function(collection, write, success, error, force) {
    // Validate preconditions.
    if(!isString(collection) || !/^[a-zA-Z0-9\-]{1,128}/.test(collection)) {
      return error(clientError(Kinvey.Error.INVALID_IDENTIFIER, {
        description : 'The collection name has an invalid format.',
        debug       : 'The collection name must be a string containing only ' +
         'alphanumeric characters and dashes, "' + collection + '" given.'
      }));
    }

    // Cast arguments.
    write = write || false;

    // If there is a database handle, try to be smart.
    if(null !== IDBAdapter.db && (true === force || !IDBAdapter.inTransaction)) {
      // If the collection exists, obtain and return the transaction handle.
      if(IDBAdapter.db.objectStoreNames.contains(collection)) {
        var mode  = write ? 'readwrite' : 'readonly';
        var txnResult = IDBAdapter.openTransactionSafely(IDBAdapter.db, [collection], mode);
        if (txnResult.error) {
          error(txnResult.error);
        }
        if (txnResult.txn != null) {
          var txn = txnResult.txn;
          var store = txn.objectStore(collection);
          return success(store);
        }

        return error(new Kinvey.Error('Unable to open a transaction for the database. Please try this database transaction again.'));
      }

      // The collection does not exist. If we want to read only, return an error
      // and do not create the collection.
      else if(!write) {// Do not create.
        return error(clientError(Kinvey.Error.COLLECTION_NOT_FOUND, {
          description : 'This collection not found for this app backend',
          debug       : { collection: collection }
        }));
      }
    }

    // There is no database handle, or the collection needs to be created. Both
    // are done through a database upgrade operation. This operation cannot be
    // executed concurrently. Therefore, queue any concurrent operations.
    if(true !== force && IDBAdapter.inTransaction) {
      return IDBAdapter.pending.push(function() {
        IDBAdapter.transaction(collection, write, success, error);
      });
    }
    IDBAdapter.inTransaction = true;// Switch flag.

    // An upgrade operation is initiated by re-opening the database with an
    // higher version number.
    var request;
    if(null !== IDBAdapter.db) {// Re-open.
      var version = IDBAdapter.db.version + 1;
      IDBAdapter.db.close();// Required by IE10.
      request = IDBAdapter.impl.open(IDBAdapter.dbName(), version);
    }
    else {// Open the current version.
      // Validate preconditions.
      if(null == Kinvey.appKey) {
        IDBAdapter.inTransaction = false;// Restore.
        return error(clientError(Kinvey.Error.MISSING_APP_CREDENTIALS));
      }
      request = IDBAdapter.impl.open(IDBAdapter.dbName());
    }

    // If the database is opened with an higher version than its current, the
    // `upgradeneeded` event is fired. Save the handle to the database, and
    // create the collection.
    request.onupgradeneeded = function() {
      IDBAdapter.db = request.result;
      if(write) {// Create the collection.
        IDBAdapter.db.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    // The `success` event is fired after `upgradeneeded` terminates. Again,
    // save the handle to the database.
    request.onsuccess = function() {
      IDBAdapter.db = request.result;

      // If a second instance of the same IndexedDB database performs an
      // upgrade operation, the `versionchange` event is fired. Then, close the
      // database to allow the external upgrade to proceed.
      IDBAdapter.db.onversionchange = function() {// Reset.
        if(null !== IDBAdapter.db) {
          IDBAdapter.db.close();
          IDBAdapter.db = null;
        }
      };

      // Try to obtain the collection handle by recursing. Append the handlers
      // to empty the queue upon success and failure. Set the `force` flag so
      // all but the current transaction remain queued.
      var wrap = function(cb) {
        return function(arg) {
          var result = cb(arg);// The original event handler.

          // The database handle has been established, we can now safely empty
          // the queue. The queue must be emptied before invoking the concurrent
          // operations to avoid infinite recursion.
          IDBAdapter.inTransaction = false;
          if(0 !== IDBAdapter.pending.length) {
            var pending = IDBAdapter.pending;
            IDBAdapter.pending = [];
            pending.forEach(function(fn) { fn(); });
          }

          return result;
        };
      };
      IDBAdapter.transaction(collection, write, wrap(success), wrap(error), true);
    };

    // The `blocked` event is not handled. In case such an event occurs, it
    // will resolve itself since the `versionchange` event handler will close
    // the conflicting database and enable the `blocked` event to continue. We
    // do, however, need to handle any other errors.
    request.onerror = function(event) {
      error(clientError(Kinvey.Error.DATABASE_ERROR, { debug: event }));
    };
  },

  /**
   * Opens a IDBDatabase transaction catching any errors that might occur.
   *
   * @param  {Database} idb    Database connection to open the transaction with.
   * @param  {Array}    stores Database stores used by transaction.
   * @param  {String}   mode   Mode of transaction.
   * @return {Object}          Contains transaction or error.
   */
  openTransactionSafely: function(idb, stores, mode) {
    try {
      return {
        txn: idb.transaction(stores, mode)
      };
    } catch (err) {
      return {
        error: err
      };
    }
  },

  /**
   * @augments {Database.batch}
   */
  batch: function(collection, documents/*, options*/) {
    // If there are no documents, return.
    if(0 === documents.length) {
      return Kinvey.Defer.resolve(documents);
    }

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, true, function(store) {
      // Save all documents in a single transaction. Instead of the `success`
      // event, bind to the `complete` event.
      var request = store.transaction;
      documents.forEach(function(document) {
        document._id = document._id || IDBAdapter.objectID();
        store.put(document);
      });
      request.oncomplete = function() {
        deferred.resolve(documents);
      };
      request.onerror = function(event) {
        var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
        deferred.reject(error);
      };
    }, function(error) {// Reject.
      deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * @augments {Database.clean}
   */
  clean: function(collection, query, options) {
    var error;

    // Deleting should not take the query sort, limit, and skip into account.
    if(null != query) {// Reset.
      query.sort(null).limit(null).skip(0);
    }

    // Obtain the documents to be deleted via `IDBAdapter.find`.
    return IDBAdapter.find(collection, query, options).then(function(documents) {
      // If there are no documents matching the query, return.
      if(0 === documents.length) {
        return { count: 0, documents: [] };
      }

      // Prepare the response.
      var deferred = Kinvey.Defer.deferred();

      // Obtain the transaction handle.
      IDBAdapter.transaction(collection, true, function(store) {
        // Delete all documents in a single transaction. Instead of the
        // `success` event, bind to the `complete` event.
        var request = store.transaction;
        documents.forEach(function(document) {
          // Check document for property _id. Thrown error will reject promise.
          if (document._id == null) {
            error = new Kinvey.Error('Document does not have _id property defined. ' +
                                     'Unable to clean database.');
            throw error;
          }

          store['delete'](document._id);
        });
        request.oncomplete = function() {
          deferred.resolve({ count: documents.length, documents: documents });
        };
        request.onerror = function(event) {
          var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
          deferred.reject(error);
        };
      });

      // Return the promise.
      return deferred.promise;
    });
  },

  /**
   * @augments {Database.count}
   */
  count: function(collection, query, options) {
    // Counting should not take the query sort, limit, and skip into account.
    if(null != query) {// Reset.
      query.sort(null).limit(null).skip(0);
    }

    // Forward to `IDBAdapter.find`, and return the response count.
    return IDBAdapter.find(collection, query, options).then(function(response) {
      return { count: response.length };
    });
  },

  /**
   * @augments {Database.destroy}
   */
  destroy: function(collection, id/*, options*/) {
    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, true, function(store) {
      // Find and delete the document. If the document could not be found,
      // throw an `ENTITY_NOT_FOUND` error.
      var request  = store.transaction;
      var document = store.get(id);
      store['delete'](id);
      request.oncomplete = function() {
        if(null == document.result) {
          return deferred.reject(clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
            description : 'This entity not found in the collection',
            debug       : { collection: collection, id: id }
          }));
        }
        deferred.resolve({ count: 1, documents: [ document.result ] });
      };
      request.onerror = function(event) {
        var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
        deferred.reject(error);
      };
    }, function(error) {// Reject.
      deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * @augments {Database.destruct}
   */
  destruct: function(/*options*/) {
    // Validate preconditions.
    if(null == Kinvey.appKey) {
      var error = clientError(Kinvey.Error.MISSING_APP_CREDENTIALS);
      return Kinvey.Defer.reject(error);
    }

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Close the database first, required by IE10.
    if(null !== IDBAdapter.db) {
      IDBAdapter.db.close();
      IDBAdapter.db = null;
    }

    // Delete the entire database.
    var request = IDBAdapter.impl.deleteDatabase(IDBAdapter.dbName());

    // Handle the `success` event.
    request.onsuccess = function() {
      deferred.resolve(null);
    };

    // The `blocked` event is not handled. In case such an event occurs, it
    // will resolve itself since the `versionchange` event handler will close
    // the conflicting database and enable the `blocked` event to continue. We
    // do, however, need to handle any other errors.
    request.onerror = function(event) {
      var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
      deferred.reject(error);
    };

    // Return the response.
    return deferred.promise;
  },

  /**
   * @augments {Database.find}
   */
  find: function(collection, query/*, options*/) {
    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, false, function(store) {
      // Retrieve all documents.
      var request = store.openCursor();
      var response = [];
      request.onsuccess = function() {
        var cursor = request.result;
        if(null != cursor) {
          response.push(cursor.value);
          cursor['continue']();
        }
        else {
          deferred.resolve(response);
        }
      };
      request.onerror = function(event) {
        deferred.reject(clientError(Kinvey.DATABASE_ERROR, { debug: event }));
      };
    }, function(error) {
      // If the error is `COLLECTION_NOT_FOUND`, return the empty set.
      if(Kinvey.Error.COLLECTION_NOT_FOUND === error.name) {
        return deferred.resolve([]);
      }
      return deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise.then(function(response) {
      // Post process the response by applying the query. If there is no query,
      // exit here.
      if(null == query) {
        return response;
      }

      // Filters.
      response = root.sift(query.toJSON().filter, response);

      // Post process.
      return query._postProcess(response);
    });
  },

  /**
   * @augments {Database.findAndModify}
   */
  findAndModify: function(collection, id, fn/*, options*/) {
    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, true, function(store) {
      var document = null;

      // Obtain and change the document.
      var request = store.get(id);
      request.onsuccess = function() {
        document = fn(request.result || null);// Apply change function.
        store.put(document);
      };

      // Retrieve and save the document in a single transaction. Instead of the
      // `success` event, bind to the `complete` event.
      var txn = store.transaction;
      txn.oncomplete = function() {
        deferred.resolve(document);
      };
      txn.onerror = function(event) {
        var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
        deferred.reject(error);
      };
    }, function(error) {// Reject.
      deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * @augments {Database.get}
   */
  get: function(collection, id/*, options*/) {
    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, false, function(store) {
      // Retrieve the document.
      var request = store.get(id);
      request.onsuccess = function() {
        if(null != request.result) {
          return deferred.resolve(request.result);
        }
        deferred.reject(clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        }));
      };
      request.onerror = function(event) {// Reject.
        deferred.reject(clientError(Kinvey.Error.DATABASE_ERROR, { debug: event }));
      };
    }, function(error) {// Reject.
      // If the error is `COLLECTION_NOT_FOUND`, convert to `ENTITY_NOT_FOUND`.
      if(Kinvey.Error.COLLECTION_NOT_FOUND === error.name) {
        error = clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        });
      }
      deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * @augments {Database.group}
   */
  group: function(collection, aggregation, options) {
    // Cast arguments. This casts the reduce string to reduce function.
    var reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce);

    // Obtain documents subject to aggregation.
    var query = new Kinvey.Query({ filter: aggregation.condition });
    return IDBAdapter.find(collection, query, options).then(function(documents) {
      // Prepare the grouping.
      var groups = {};

      // Segment documents into groups.
      documents.forEach(function(document) {
        // Determine the group the document belongs to.
        // NOTE Dot-separated (nested) fields are not supported.
        var group = {};
        for(var name in aggregation.key) {
          if(aggregation.key.hasOwnProperty(name)) {
            group[name] = document[name];
          }
        }

        // Initialize the group (if not done yet).
        var key = JSON.stringify(group);
        if(null == groups[key]) {
          groups[key] = group;
          for(var attr in aggregation.initial) {// Add initial attributes.
            if(aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        // Run the reduce function on the group and document.
        aggregation.reduce(document, groups[key]);
      });

      // Cast the groups to the response.
      var response = [];
      for(var segment in groups) {
        if(groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }
      return response;
    });
  },

  /**
   * @augments {Database.save}
   */
  save: function(collection, document/*, options*/) {
    // Cast arguments.
    document._id = document._id || IDBAdapter.objectID();

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain the transaction handle.
    IDBAdapter.transaction(collection, true, function(store) {
      // Save the document.
      var request = store.put(document);
      request.onsuccess = function() {
        deferred.resolve(document);
      };
      request.onerror = function(event) {
        var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: event });
        deferred.reject(error);
      };
    }, function(error) {// Reject.
      deferred.reject(error);
    });

    // Return the promise.
    return deferred.promise;
  },

  /**
   * @augments {Database.update}
   */
  update: function(collection, document, options) {
    // Forward to `IDBAdapter.save`.
    return IDBAdapter.save(collection, document, options);
  }
};

function useIndexedDBAdapter() {
  // Use IndexedDB adapter.
  if('undefined' !== typeof IDBAdapter.impl && 'undefined' !== typeof root.sift) {
    Database.use(IDBAdapter);

    // Add `Kinvey.Query` operators not supported by `sift`.
    ['near', 'regex', 'within'].forEach(function(operator) {
      root.sift.useOperator(operator, function() {
        throw new Kinvey.Error(operator + ' query operator is not supported locally.');
      });
    });
  }
}


if ('undefined' !== typeof root.cordova) {
  // WebSql plugin won't register until after deviceready event is fired
  document.addEventListener('deviceready', useIndexedDBAdapter, false);
}
else {
  useIndexedDBAdapter();
}

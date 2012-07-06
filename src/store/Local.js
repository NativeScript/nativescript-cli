(function() {

  /*globals window*/

  // Grab local database implementation.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

  // Define the Kinvey.Store.Local class.
  Kinvey.Store.Local = Base.extend({
    // Default options.
    options: {
      error: function() { },
      success: function() { }
    },

    /**
     * Kinvey.Store.Local
     * 
     * @name Kinvey.Store.Local
     * @constructor
     * @param {string} collection Collection name.
     * @param {Object} [options]
     */
    constructor: function(collection, options) {
      this.collection = collection.replace('-', '_');
      this.name = 'Kinvey.' + Kinvey.appKey;// database name.

      // Options.
      options && this.configure(options);
    },

    /** @lends Kinvey.Store.Local# */

    /**
     * Aggregates objects from the store.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Object} [options] Options.
     */
    aggregate: function(aggregation, options) {
      options = this._options(options);

      // Open transaction.
      var store = Kinvey.Store.Local.AGGREGATION_STORE;
      this._transaction(this._getSchema(store), IDBTransaction.READ_ONLY || 'readonly', bind(this, function(txn) {
        // Retrieve from store.
        var req = txn.objectStore(store).get(this._getCacheKey(aggregation));

        // Handle transaction status.
        txn.oncomplete = function() {
          // Result is undefined if data was not found.
          var result = req.result;
          if(result) {
            return options.success(result.value, { cache: true });
          }
          options.error(Kinvey.Error.NOT_FOUND);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Configures store.
     * 
     * @param {Object} options
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    configure: function(options) {
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
    },

    /**
     * Returns objects by id.
     * 
     * @param {Array} list
     * @param {Options} [options] Options.
     */
    getById: function(list, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this._getSchema(this.collection), IDBTransaction.READ_ONLY || 'readonly', bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve in parallel.
        list.forEach(function(id) {
          var req = store.get(id);
          req.onsuccess = function() {
            response[id] = req.result || null;
          };
        });

        // Handle transaction status.
        txn.oncomplete = bind(this, function() {
          options.success(response, { cache: true });
        });
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }));
    },

    /**
     * Removes objects by id.
     * 
     * @param {Array} list List of ids.
     * @param {Object} [options] Options.
     */
    removeById: function(list, options) {
      options = this._options(options);

      // Failure handler triggers error handler.
      var failure = function(code, description) {
        options.error({
          code: code,
          description: description || code,
          debug: ''
        });
      };

      // Open transaction.
      this._transaction(this._getSchema(this.collection), IDBTransaction.READ_WRITE || 'readwrite', bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Remove all objects.
        list.forEach(function(id) {
          store['delete'](id);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }));
    },

    /**
     * Returns transaction log of operations performed locally.
     * 
     * @param {Object} [options] Options.
     */
    getTransactionLog: function(options) {
      options = this._options(options);

      // Open transaction.
      var store = Kinvey.Store.Local.TRANSACTION_STORE;
      this._transaction(this._getSchema(store), IDBTransaction.READ_ONLY || 'readonly', bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Iterate over all collections to collect changes.
        var it = txn.objectStore(store).openCursor();
        it.onsuccess = function() {
          var cursor = it.result;
          if(cursor && cursor.value) {
            var result = cursor.value;
            result.collection = result.collection.replace('_', '-');// Restore original.

            // Add to response and proceed.
            response[result.collection] = result.changes;
            cursor['continue']();
          }
        };

        // Handle transaction status.
        txn.oncomplete = bind(this, function() {
          options.success(response);
        });
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Purges local database. Use with caution.
     * 
     * @param {Object} [options] Options.
     */
    purge: function(options) {
      options = this._options(options);

      // Open mutation.
      this._mutate(function(db) {
        // Remove stores one by one.
        var store;
        while(null !== (store = db.objectStoreNames.item(0))) {
          db.deleteObjectStore(store);
        }
        options.success(null, { cache: true });
      }, options.error);
    },

    /**
     * Adds data to the database.
     * 
     * @param {string} type Data type.
     * @param {*} arg Data key.
     * @param {*} data Data to be added.
     * @param {Object} [options] Options.
     */
    put: function(type, arg, data, options) {
      options = this._options(options);

      // Handle different types of data.
      switch(type) {
        case 'aggregation':
          this._putAggregation(arg, data, options);
          break;
        case 'query':
          // If data is null, the object needs to be removed from cache.
          null !== data ? this._putObject(data, options) : this._removeObject(arg, options);
          break;
        case 'queryWithQuery':
          this._putQuery(arg, data, options);
          break;
      }
    },

    /**
     * Queries the store for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options] Options.
     */
    query: function(id, options) {
      options = this._options(options);

      // Open transaction.
      var store = this.collection;
      this._transaction(this._getSchema(store), IDBTransaction.READ_ONLY || 'readonly', function(txn) {
        // Retrieve from store.
        var req = txn.objectStore(store).get(id);

        // Handle transaction status.
        txn.oncomplete = function() {
          // Result is undefined if data was not found.
          var result = req.result;
          if(result) {
            return options.success(result, { cache: true });
          }
          options.error(Kinvey.Error.NOT_FOUND);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }, options.error);
    },

    /**
     * Queries the store for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    queryWithQuery: function(query, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([
        this._getSchema(Kinvey.Store.Local.QUERY_STORE),
        this._getSchema(this.collection)
      ], IDBTransaction.READ_ONLY || 'readonly', bind(this, function(txn) {
        // Prepare final response.
        var response = [];

        // Open stores.
        var metaStore = txn.objectStore(Kinvey.Store.Local.QUERY_STORE);
        var store = txn.objectStore(this.collection);

        // Retrieve metadata from store.
        var metaReq = metaStore.get(this._getCacheKey(query));
        metaReq.onsuccess = function() {
          var result = metaReq.result;// query is cached.
          if(result) {
            // Define handler to add item to response.
            var addToResponse = function(id) {
              var req = store.get(id);
              req.onsuccess = function() {
                // Only add to response if item is found. Otherwise, ignore.
                req.result && response.push(req.result);
              };
            };

            // Loop through cached list of ids.
            for(var index in result.value) {
              if(result.value.hasOwnProperty(index)) {
                addToResponse(result.value[index]);
              }
            }
          }
        };

        // Handle transaction status.
        txn.oncomplete = function() {
          if(metaReq.result) {
            return options.success(response, { cache: true });
          }
          options.error(Kinvey.Error.NOT_FOUND);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes object from the store.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options] Options.
     */
    remove: function(object, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([
        this._getSchema(Kinvey.Store.Local.TRANSACTION_STORE),
        this._getSchema(this.collection)
      ], IDBTransaction.READ_WRITE || 'readwrite', bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve latest version of the object from the store.
        var req = store.get(object._id);
        req.onsuccess = bind(this, function() {
          // Remove object from the store.
          var result = req.result;
          store['delete'](result._id);

          // Log transaction.
          var metaStore = txn.objectStore(Kinvey.Store.Local.TRANSACTION_STORE);
          this._logTransaction(metaStore, result);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    removeWithQuery: function(query, options) {
      options = this._options(options);
      options.error(Kinvey.Error.FEATURE_UNAVAILABLE, 'Removal based on a query is not supported by this store.');
    },

    /**
     * Saves object to the store.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options] Options.
     */
    save: function(object, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([
        this._getSchema(Kinvey.Store.Local.TRANSACTION_STORE),
        this._getSchema(this.collection)
      ], IDBTransaction.READ_WRITE || 'readwrite', bind(this, function(txn) {
        // Store object in store. If entity is new, assign an ID. This is done
        // manually to overcome IndexedDBs approach to only assigns integers.
        object._id || (object._id = new Date().getTime().toString());
        txn.objectStore(this.collection).put(object);

        // Log transaction.
        var store = txn.objectStore(Kinvey.Store.Local.TRANSACTION_STORE);
        this._logTransaction(store, object);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(object, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Returns cache key.
     * 
     * @private
     * @param {Object} object
     * @return {string} Cache key.
     */
    _getCacheKey: function(object) {
      object.collection = this.collection;
      return JSON.stringify(object);
    },

    /**
     * Returns schema for object store.
     * 
     * @private
     * @param {string} store Store.
     * @return {Object} Schema.
     */
    _getSchema: function(store) {
      // Schemas only differ in the field used as primary key.
      var key;
      switch(store) {
        // Metadata stores.
        case Kinvey.Store.Local.AGGREGATION_STORE:
        case Kinvey.Store.Local.QUERY_STORE:
          key = 'key';
        break;

        // Transaction store.
        case Kinvey.Store.Local.TRANSACTION_STORE:
          key = 'collection';
          break;

        // Data stores.
        default:
          key = '_id';
      }
      return {
        name: store,
        options: { keyPath: key }
      };
    },

    /**
     * Adds transaction to the log. Since this method is always called inside a
     * transaction, no asynchronous callbacks are necessary.
     * 
     * @private
     * @param {IDBObjectStore} store Object store.
     * @param {Object} object Object.
     */
    _logTransaction: function(store, object) {
      // Retrieve transaction log from the store.
      var req = store.get(this.collection);
      req.onsuccess = bind(this, function() {
        // Create transaction log if non-existant, and add our change.
        var log = req.result || {
          collection: this.collection,
          changes: {}
        };
        log.changes[object._id] = (object._kmd && object._kmd.lmt) || null;

        // Save to store.
        store.put(log);
      });
    },

    /**
     * Mutates the database schema.
     * 
     * @private
     * @param {function(handle)} success Success callback.
     * @param {function(error)} failure Failure callback.
     */
    _mutate: function(upgrade, success, failure) {
      this._open(null, null, bind(this, function(database) {
        var version = parseInt(database.version || 0, 10) + 1;

        // Earlier versions of the spec defines setVersion for mutation. Later,
        // this was changed to the onupgradeneeded event. We support both.
        if(database.setVersion) {// old.
          var req = database.setVersion(version);
          req.onsuccess = function() {
            upgrade(database);
            success(database);
          };
          req.onerror = function() {
            failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, req.error || 'Mutation error.');
          };
        }
        else {// new.
          this._open(version, upgrade, success, failure);
        }
      }), failure);
    },

    /**
     * Opens the database.
     * 
     * @private
     * @param {integer} [version] Database version.
     * @param {function(handle)} success Success callback.
     * @param {function(error)} failure Failure callback.
     */
    _open: function(version, upgrade, success, failure) {
      var req;
      if(null === version) {// open latest version.
        if(null !== Kinvey.Store.Local.database) {// reuse if possible.
          return success(Kinvey.Store.Local.database);
        }
        req = indexedDB.open(this.name);
      }
      else {// open specific version
        req = indexedDB.open(this.name, version);
      }

      req.onupgradeneeded = function() {
        Kinvey.Store.Local.database = req.result;
        upgrade && upgrade(Kinvey.Store.Local.database);
      };
      req.onsuccess = bind(this, function() {
        Kinvey.Store.Local.database = req.result;
        Kinvey.Store.Local.database.onversionchange = function() {
          if(Kinvey.Store.Local.database) {
            Kinvey.Store.Local.database.close();
            Kinvey.Store.Local.database = null;
          }
        };
        success(Kinvey.Store.Local.database);
      });
      req.onblocked = req.onerror = function() {
        failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, req.error || 'Failed to open database.');
      };
    },

    /**
     * Returns complete options object.
     * 
     * @param {Object} options Options.
     * @return {Object} Options.
     */
    _options: function(options) {
      options || (options = {});
      options.success || (options.success = this.options.success);

      // Create convenience shortcut for error handler.
      var fnError = options.error || this.options.error;
      options.error = function(code, description) {
        fnError({
          code: code,
          description: description || code,
          debug: ''
        }, { cache: true });
      };

      return options;
    },

    /**
     * Adds aggregation to the database.
     * 
     * @private
     * @param {Object} aggregation Aggregation object.
     * @param {Array} data Data.
     * @param {Object} options Options.
     */
    _putAggregation: function(aggregation, data, options) {
      // Failure handler triggers error handler.
      var failure = function(code, description) {
        options.error({
          code: code,
          description: description || code,
          debug: ''
        });
      };

      // Open transaction.
      var store = Kinvey.Store.Local.AGGREGATION_STORE;
      this._transaction(this._getSchema(store), IDBTransaction.READ_WRITE || 'readwrite', bind(this, function(txn) {
        // Add metadata to store.
        var req = txn.objectStore(store).put({
          key: this._getCacheKey(aggregation),
          value: data
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), failure);
    },

    /**
     * Adds object to the database.
     * 
     * @private
     * @param {Object} object Object to be added.
     * @param {Object} options Options
     */
    _putObject: function(object, options) {
      // Failure handler triggers error handler.
      var failure = function(code, description) {
        options.error({
          code: code,
          description: description || code,
          debug: ''
        });
      };

      // Open transaction.
      var store = this.collection;
      this._transaction(this._getSchema(store), IDBTransaction.READ_WRITE || 'readwrite', function(txn) {
        // Save to store.
        txn.objectStore(store).put(object);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(object, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }, failure);
    },

    /**
     * Adds query to the database.
     * 
     * @private
     * @param {Object} query Query object.
     * @param {Array} data Data.
     * @param {Object} options Options.
     */
    _putQuery: function(query, data, options) {
      // Failure handler triggers error handler.
      var failure = function(code, description) {
        options.error({
          code: code,
          description: description || code,
          debug: ''
        }, { cache: true });
      };

      // Open transaction.
      this._transaction([
        this._getSchema(this.collection),
        this._getSchema(Kinvey.Store.Local.QUERY_STORE)
      ], IDBTransaction.READ_WRITE || 'readwrite', bind(this, function(txn) {
        // Open object store.
        var store = txn.objectStore(this.collection);

        // Save all objects.
        var list = [];
        data.forEach(function(object) {
          list.push(object._id);
          store.put(object);
        });

        // Open metadata store.
        var qStore = txn.objectStore(Kinvey.Store.Local.QUERY_STORE);

        // Add metadata to store.
        var req = qStore.put({
          key: this._getCacheKey(query),
          value: list
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }), failure);
    },

    /**
     * Removes object from cache.
     * 
     * @private
     * @param {string} id Object id.
     * @param {Object} options Options.
     */
    _removeObject: function(id, options) {
      // Failure handler triggers error handler.
      var failure = function(code, description) {
        options.error({
          code: code,
          description: description,
          debug: ''
        });
      };

      // Open transaction.
      var store = this.collection;
      this._transaction(this._getSchema(store), IDBTransaction.READ_WRITE || 'readwrite', function(txn) {
        // Save to store.
        txn.objectStore(store)['delete'](id);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cache: true });
        };
        txn.onabort = txn.onerror = function() {
          failure(Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY, txn.error || 'Failed to execute transaction.');
        };
      }, failure);
    },

    /**
     * Opens transaction for some store.
     * 
     * @private
     * @param {Array|Object} stores (List of) store(s)
     * @param {function(transaction)} success Success callback.
     * @param {function(error)} failure Failure callback.
     */
    _transaction: function(stores, mode, success, failure) {
      this._open(null, null, bind(this, function(db) {
        var queue = [];
        var storeNames = [];
        !(stores instanceof Array) && (stores = [stores]);

        // Check if all stores exist.
        stores.forEach(function(store) {
          storeNames.push(store.name);
          if(!db.objectStoreNames.contains(store.name)) {
            queue.push(store);
          }
        });

        // Create missing stores.
        if(0 !== queue.length) {
          this._mutate(function(db) {
            queue.forEach(function(store) {
              db.createObjectStore(store.name, store.options);
            });
          }, function(db) {
            // Create and return the transaction.
            success(db.transaction(storeNames, mode));
          }, failure);
        }
        else {
          // Create and return the transaction.
          success(db.transaction(storeNames, mode));
        }
      }), failure);
    },

    /**
     * Updates transaction log.
     * 
     * @private
     * @param {Object} status Synchronization status.
     * @param {function()} complete Complete callback.
     */
    updateTransactionLog: function(sets, complete) {
      // Open transaction.
      this._transaction(this._getSchema(Kinvey.Store.Local.TRANSACTION_STORE), IDBTransaction.READ_WRITE || 'readwrite', function(txn) {
        // Open store.
        var store = txn.objectStore(Kinvey.Store.Local.TRANSACTION_STORE);

        // Iterate through collections.
        Object.getOwnPropertyNames(sets).forEach(function(collection) {
          var name = collection.replace('-', '_');
          var req = store.get(name);
          req.onsuccess = bind(this, function() {
            var result = req.result || {
              collection: name,
              changes: {}
            };

            // Remove all committed object from changes. Any other changes are
            // maintained, so they can be synchronized (again) later on.
            sets[collection].committed.forEach(function(id) {
              delete result.changes[id];
            });

            // Update store.            
            0 === Object.keys(result.changes).length ? store['delete'](name) : store.put(result);
          });
        });

        // Handle transaction status.
        txn.onabort = txn.oncomplete = txn.onerror = complete;
      }, complete);
    }
  }, {
    // Meta data stores.
    AGGREGATION_STORE: '_aggregation',
    QUERY_STORE: '_query',
    TRANSACTION_STORE: '_transactions',

    // Shared database instance.
    database: null
  });

}());
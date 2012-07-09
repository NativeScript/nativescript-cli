(function() {

  // Grab database implementation.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

  // Define the Database class.
  var Database = Base.extend({
    /**
     * Creates a new database.
     * 
     * @constructor
     * @name Database
     * @param {string} collection Collection name.
     */
    constructor: function(collection) {
      this.name = 'Kinvey.' + Kinvey.appKey;// Unique per app.
      this.collection = collection;
    },

    /** @lends Database# */

    // As a convenience, implement the store interface.

    /**
     * Aggregates objects in database.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Object} [options]
     */
    aggregate: function(aggregation, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.AGGREGATION_STORE, Database.READ_ONLY, bind(this, function(txn) {
        // Retrieve aggregation.
        var key = this._getKey(aggregation);
        var req = txn.objectStore(Database.AGGREGATION_STORE).get(key);

        // Handle transaction status.
        txn.oncomplete = function() {
          // If result is null, return an error.
          var result = req.result;
          if(result) {
            options.success(result.response, { cached: true });
          }
          else {
            options.error(Kinvey.Error.DATABASE_ERROR, 'Aggregation is not in database.');
          }
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Queries the database for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options]
     */
    query: function(id, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_ONLY, bind(this, function(txn) {
        // Retrieve object.
        var req = txn.objectStore(this.collection).get(id);

        // Handle transaction status.
        txn.oncomplete = function() {
          // If result is null, return a not found error.
          var result = req.result;
          if(result) {
            options.success(result, { cached: true });
          }
          else {
            options.error(Kinvey.Error.ENTITY_NOT_FOUND, 'This entity could not be found.');
          }
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Queries the database for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options]
     */
    queryWithQuery: function(query, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([this.collection, Database.QUERY_STORE], Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = [];

        // Retrieve query.
        var key = this._getKey(query);
        var req = txn.objectStore(Database.QUERY_STORE).get(key);
        req.onsuccess = bind(this, function() {
          var result = req.result;
          if(result) {
            // Open store.
            var store = txn.objectStore(this.collection);

            // Retrieve objects.
            result.response.forEach(function(id) {
              var req = store.get(id);
              req.onsuccess = function() {
                // Only add to response if object is found.
                req.result && response.push(req.result);
              };
            });
          }
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          if(req.result) {
            options.success(response, { cached: true });
          }
          else {
            options.error(Kinvey.Error.DATABASE_ERROR, 'Query is not in database.');
          }
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes object from the database.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options]
     */
    remove: function(object, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([this.collection, Database.TRANSACTION_STORE], Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve object, to see if there is any metadata we need.
        var req = store.get(object._id);
        req.onsuccess = bind(this, function() {
          var result = req.result || object;

          // Remove object and add transaction.
          store['delete'](result._id);
          !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), result);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes multiple objects from the database.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options]
     */
    removeWithQuery: function(query, options) {
      // First, retrieve all items, so we can remove them one by one.
      this.queryWithQuery(query, merge(options, {
        success: bind(this, function(list) {
          // Open transaction.
          this._transaction([this.collection, Database.QUERY_STORE, Database.TRANSACTION_STORE], Database.READ_WRITE, bind(this, function(txn) {
            // Remove query.
            var key = this._getKey(query);
            txn.objectStore(Database.QUERY_STORE)['delete'](key);

            // Remove objects and add transaction.
            var store = txn.objectStore(this.collection);
            list.forEach(function(object) {
              store['delete'](object._id);
            });
            !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), list);

            // Handle transaction status.
            txn.oncomplete = function() {
              options.success(null, { cached: true });
            };
            txn.onabort = txn.onerror = function() {
              options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
            };
          }), options.error);
        })
      }));
    },

    /**
     * Saves object to the database.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options]
     */
    save: function(object, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([this.collection, Database.TRANSACTION_STORE], Database.READ_WRITE, bind(this, function(txn) {
        // Store object in store. If entity is new, assign an ID. This is done
        // manually to overcome IndexedDBs approach to only assigns integers.
        object._id || (object._id = new Date().getTime().toString());

        // Save object and add transaction.
        txn.objectStore(this.collection).put(object);
        !options.silent && this._addTransaction(txn.objectStore(Database.TRANSACTION_STORE), object);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(object, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    // Data management.

    /**
     * Retrieves multiple objects at once.
     * 
     * @param {Array} list List of object ids.
     * @param {Object} [options]
     */
    multiQuery: function(list, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Open store.
        var store = txn.objectStore(this.collection);

        // Retrieve objects.
        list.forEach(function(id) {
          var req = store.get(id);
          req.onsuccess = function() {
            response[id] = req.result || null;
          };
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes multiple objects at once.
     * 
     * @param {Array} list List of object ids.
     * @param {Object} [options]
     */
    multiRemove: function(list, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(this.collection, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Remove objects.
        list.forEach(function(id) {
          store['delete'](id);
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(null, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Writes data to database.
     * 
     * @param {string} type Data type.
     * @param {*} key Data key.
     * @param {*} data Data.
     * @param {Object} [options]
     */
    put: function(type, key, data, options) {
      options || (options = {});
      options.silent = true;// Do not record transactions.

      // Take advantage of store methods.
      switch(type) {
        case 'aggregate':
          this._putAggregation(key, data, options);
          break;
        case 'query':// query, remove and save.
          null !== data ? this.save(data, options) : this.remove(key, options);
          break;
        case 'queryWithQuery':// queryWithQuery and removeWithQuery.
          null !== data ? this._putQueryWithQuery(key, data, options) : this.removeWithQuery(key, options);
          break;
      }
    },

    /**
     * Writes aggregation to database.
     * 
     * @private
     * @param {Object} aggregation Aggregation object.
     * @param {Array} response Aggregation.
     * @param {Object} [options]
     */
    _putAggregation: function(aggregation, response, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.AGGREGATION_STORE, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(Database.AGGREGATION_STORE);

        // Save or delete aggregation.
        var key = this._getKey(aggregation);
        null !== response ? store.put({
          aggregation: key,
          response: response
        }) : store['delete'](key);

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Writes query and resulting objects to database.
     * 
     * @private
     * @param {Object} query Query object.
     * @param {Array} response Response.
     * @param {Object} [options]
     */
    _putQueryWithQuery: function(query, response, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction([this.collection, Database.QUERY_STORE], Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(this.collection);

        // Save objects.
        var objects = [];
        response.forEach(function(object) {
          store.put(object);
          objects.push(object._id);
        });

        // Save query.
        txn.objectStore(Database.QUERY_STORE).put({
          query: this._getKey(query),
          response: objects
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    // Transaction management.

    /**
     * Returns pending transactions.
     * 
     * @param {object} [options]
     */
    getTransactions: function(options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.TRANSACTION_STORE, Database.READ_ONLY, bind(this, function(txn) {
        // Prepare response.
        var response = {};

        // Open store.
        var store = txn.objectStore(Database.TRANSACTION_STORE);

        // If this instance is tied to a particular collection, retrieve
        // transactions for that collection only.
        if(Database.TRANSACTION_STORE !== this.collection) {
          var req = store.get(this.collection);
          req.onsuccess = bind(this, function() {
            var result = req.result;
            result && (response[this.collection] = result.transactions);
          });
        }
        else {// Iterate over all collections, and collect their transactions.
          var it = store.openCursor();
          it.onsuccess = function() {
            var cursor = it.result;
            if(cursor) {
              var result = cursor.value;
              response[result.collection] = result.transactions;

              // Proceed.
              cursor['continue']();
            }
          };
        }

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(response);
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Removes transactions.
     * 
     * @param {Object} transactions
     * @param {Object} [options]
     */
    removeTransactions: function(transactions, options) {
      options = this._options(options);

      // Open transaction.
      this._transaction(Database.TRANSACTION_STORE, Database.READ_WRITE, bind(this, function(txn) {
        // Open store.
        var store = txn.objectStore(Database.TRANSACTION_STORE);

        // Retrieve transactions for this collection.
        var req = store.get(this.collection);
        req.onsuccess = bind(this, function() {
          var result = req.result;
          if(result) {
            // Remove all committed transactions.
            transactions.forEach(function(id) {
              delete result.transactions[id];
            });

            // Update store.
            Object.keys(result.transactions).length ? store.put(result) : store['delete'](this.collection);
          }
        });

        // Handle transaction status.
        txn.oncomplete = function() {
          options.success(transactions, { cached: true });
        };
        txn.onabort = txn.onerror = function() {
          options.error(Kinvey.Error.DATABASE_ERROR, txn.error || 'Failed to execute transaction.');
        };
      }), options.error);
    },

    /**
     * Adds a transaction for object to transaction store.
     * 
     * @private
     * @param {IDBObjectStore} store Transaction store.
     * @param {Array|Object} objects Object(s) under transaction.
     */
    _addTransaction: function(store, objects) {
      objects instanceof Array || (objects = [objects]);

      // Append new transactions to this collection.
      var req = store.get(this.collection);
      req.onsuccess = bind(this, function() {
        var result = req.result || {
          collection: this.collection,
          transactions: {}
        };

        // Add and save transaction. Add timestamp as value.
        objects.forEach(function(object) {
          result.transactions[object._id] = object._kmd ? object._kmd.lmt : null;
        });
        store.put(result);
      });
    },

    // IndexedDB convenience methods.

    /**
     * Returns key.
     * 
     * @private
     * @param {Object} object
     * @return {string} Key.
     */
    _getKey: function(object) {
      object.collection = this.collection;
      return JSON.stringify(object);
    },

    /**
     * Returns schema for database store.
     * 
     * @private
     * @param {string} store Store name.
     * @return {Object} Schema.
     */
    _getSchema: function(store) {
      // Map defining primary key for metadata stores. If the store is not
      // a metadata store, simply return _id (see below).
      var key = {};
      key[Database.TRANSACTION_STORE] = 'collection';
      key[Database.AGGREGATION_STORE] = 'aggregation';
      key[Database.QUERY_STORE] = 'query';

      // Return schema.
      return {
        name: store,
        options: { keyPath: key[store] || '_id' }
      };
    },

    /**
     * Mutates the database schema.
     * 
     * @private
     * @param {function()} upgrade Upgrade callback.
     * @param {function(database)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _mutate: function(upgrade, success, error) {
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
            error({
              error: Kinvey.Error.DATABASE_ERROR,
              description: req.error || 'Mutation error.',
              debug: ''
            });
          };
        }
        else {// According to spec: reopen database with newer version.
          this._open(version, upgrade, success, error);
        }
      }), error);
    },

    /**
     * Opens the database.
     * 
     * @private
     * @param {integer} [version] Database version.
     * @param {function()} [update] Upgrade callback.
     * @param {function(database)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _open: function(version, upgrade, success, error) {
      // Reuse if possible.
      if(null !== Database.instance && null == version) {
        return success(Database.instance);
      }

      // If no version is specified, use the latest version.
      var req;
      if(null == version) {
        req = indexedDB.open(this.name);
      }
      else {// open specific version
        req = indexedDB.open(this.name, version);
      }

      // Handle database status.
      req.onupgradeneeded = function() {
        Database.instance = req.result;
        upgrade && upgrade(Database.instance);
      };
      req.onsuccess = bind(this, function() {
        Database.instance = req.result;

        // Handle versionchange when another process alters it.
        Database.instance.onversionchange = function() {
          if(Database.instance) {
            Database.instance.close();
            Database.instance = null;
          }
        };
        success(Database.instance);
      });
      req.onblocked = req.onerror = function() {
        error({
          error: Kinvey.Error.DATABASE_ERROR,
          description: req.error || 'Failed to open database.',
          debug: ''
        });
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

      // Create convenient error handler shortcut.
      var fnError = options.error || function() { };
      options.error = function(error, description) {
        fnError({
          error: error,
          description: description || error,
          debug: ''
        }, { cached: true });
      };
      options.success || (options.success = function() { });

      return options;
    },

    /**
     * Opens transaction for store(s).
     * 
     * @private
     * @param {Array|string} stores Store name(s).
     * @param {string} mode Transaction mode.
     * @param {function(transaction)} success Success callback.
     * @param {function(error)} error Failure callback.
     */
    _transaction: function(stores, mode, success, error) {
      !(stores instanceof Array) && (stores = [stores]);

      // Open database.
      this._open(null, null, bind(this, function(db) {
        // Make sure all stores exist.
        var missingStores = [];
        stores.forEach(function(store) {
          if(!db.objectStoreNames.contains(store)) {
            missingStores.push(store);
          }
        });

        // Create missing stores.
        if(0 !== missingStores.length) {
          this._mutate(bind(this, function(db) {
            missingStores.forEach(bind(this, function(store) {
              var schema = this._getSchema(store);
              db.createObjectStore(schema.name, schema.options);
            }));
          }), function(db) {// Return a transaction.
            success(db.transaction(stores, mode));
          }, error);
        }
        else {// Return a transaction.
          success(db.transaction(stores, mode));
        }
      }), error);
    }
  }, {
    /** @lends Database */

    // Transaction modes.
    READ_ONLY: IDBTransaction.READ_ONLY || 'readonly',
    READ_WRITE: IDBTransaction.READ_WRITE || 'readwrite',

    // Stores.
    AGGREGATION_STORE: '_aggregations',
    QUERY_STORE: '_queries',
    TRANSACTION_STORE: '_transactions',

    // For performance reasons, keep one database open for the whole app.
    instance: null
  });

}());
(function() {

  /*globals window*/

  // Grab local database implementation.
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

  // Define the Kinvey.Store.Local class.
  Kinvey.Store.Local = Base.extend({
    // Database handle.
    database: null,

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

      // Aggregations are cached in the meta data table only.
      this._getMeta(Kinvey.Store.Local.AGGREGATION_STORE, this._getCacheKey(aggregation), {
        success: function(response, info) {
          options.success(response.value, info);
        },
        error: options.error
      });
    },

    /**
     * Caches aggregation.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Array} response Response.
     * @param {Object} [options] Options.
     */
    cacheAggregation: function(aggregation, response, options) {
      options = this._options(options);
      this._setMeta(Kinvey.Store.Local.AGGREGATION_STORE, {
        key: this._getCacheKey(aggregation),
        value: response
      }, options);
    },

    /**
     * Caches object.
     * 
     * @param {Object} object Object to be cached.
     * @param {Object} [options] Options.
     */
    cacheObject: function(object, options) {
      this.save(object, options);
    },

    /**
     * Caches query.
     * 
     * @param {Object} query Query object.
     * @param {Array} response Response.
     * @param {Object} [options] options.
     */
    cacheQuery: function(query, response, options) {
      options = this._options(options);

      // Prepare result.
      var list = [];

      // Define handler to cache the query and its list of ids.
      var oncomplete = bind(this, function() {
        this._setMeta(Kinvey.Store.Local.QUERY_STORE, {
          key: this._getCacheKey(query),
          value: list
        }, options);
      });

      // First pass; cache response.
      var cache = bind(this, function(i, complete) {
        var object = response[i];
        if(object) {
          // Add id to list.
          list.push(object._id);

          // Trigger caching of next object.
          var next = function() {
            cache(i + 1, complete);
          };

          // Save object to cache. On failure, just continue.
          return this.cacheObject(object, {
            success: next,
            error: next
          });
        }

        // All objects are cached, proceed.
        complete();
      });

      // Trigger first pass.
      cache(0, oncomplete);
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
     * Logs in user.
     * 
     * @param {Object} object
     * @param {Object} [options] Options.
     */
    login: function(object, options) {
      options = this._options(options);

      var msg = 'Logging in is not supported by this store.';
      options.error({
        error: msg,
        message: msg
      }, { local: true });
    },

    /**
     * Purges local database. Use with caution.
     * 
     * @param {Object} [options] Options.
     */
    purge: function(options) {
      options = this._options(options);

      // Delete all collections from the database.
      this._db({
        success: bind(this, function(db) {
          // This operation is performed through a versionchange transaction.
          this._migrate(db, function(db) {
            // Delete all stores, one by one.
            var store;
            while(null !== (store = db.objectStoreNames.item(0))) {
              db.deleteObjectStore(store);
            }
          }, {
            success: function() {
              options.success({}, { local: true });
            },
            error: options.error
          });
        }),
        error: options.error
      });
    },

    /**
     * Queries the store for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options] Options.
     */
    query: function(id, options) {
      options = this._options(options);

      // Convenience shortcut.
      var c = this.collection;
      var errorMsg = 'Not found';

      this._db({
        success: bind(this, function(db) {
          // First pass; check whether collection exists.
          if(!db.objectStoreNames.contains(c)) {
            options.error({
              error: errorMsg,
              message: errorMsg
            }, { local: true });
            return;
          }

          // Second pass; check whether entity exists.
          var store = db.transaction(c).objectStore(c);
          var tnx = store.get(id);
          tnx.onsuccess = tnx.onerror = function() {
            // Success handler is also fired when entity is not found. Check here.
            null != tnx.result ? options.success(tnx.result, { local: true }) : options.error({
              error: tnx.error || errorMsg,
              message: tnx.error || errorMsg
            }, { local: true });
          };
        }),
        error: options.error
      });
    },

    /**
     * Queries the store for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    queryWithQuery: function(query, options) {
      options = this._options(options);

      // Convenience shortcut.
      var c = this.collection;

      // First pass; get query meta data.
      this._getMeta(Kinvey.Store.Local.QUERY_STORE, this._getCacheKey(query), {
        success: bind(this, function(response, info) {
          // Response is a list of object ids we need to retrieve.
          var list = response.value;
          var result = [];
          var total = list.length;

          // If response is empty, return here.
          if(0 === total) {
            return options.success(result, info);
          }

          // IndexedDB allows iterating through objects, as long as they
          // are sorted by key. Do that here.
          var sortedList = list;
          sortedList.sort();

          // Retrieve objects.
          this._db({
            success: bind(this, function(db) {
              // If somehow the store is gone, return with an error.
              if(!db.objectStoreNames.contains(c)) {
                var msg = 'Not found.';
                return options.error({
                  error: msg,
                  message: msg
                });
              }

              // Create iterator for iterating from lowest to highest id.
              var store = db.transaction(c).objectStore(c);
              var it = store.openCursor(IDBKeyRange.bound(sortedList[0], sortedList[total - 1]));
              it.onsuccess = function() {
                var cursor = it.result;
                if(cursor) {// some object found.
                  var object = cursor.value;
                  result.push(object);

                  // It is possible our cache is not complete, therefore, we
                  // need to make sure the iterator counter is updated.
                  var next = sortedList.indexOf(object._id) + 1;
                  if(next < total) {
                    // Skip to desired object next in range.
                    return cursor['continue'](sortedList[next]);
                  }
                }

                // No more objects. Re-apply original order.
                result.sort(function(a, b) {
                  return list.indexOf(a._id) > list.indexOf(b._id) ? 1 : -1;
                });
                options.success(result, info);
              };
              it.onerror = function() {
                var msg = it.error || 'Error.';
                options.error({
                  error: msg,
                  message: msg
                }, info);
              };
            }),
            error: options.error
          });
        }),
        error: options.error
      });
    },

    /**
     * Removes object from the store.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options] Options.
     */
    remove: function(object, options) {
      options = this._options(options);

      // Convenience shortcut.
      var c = this.collection;

      this._db({
        success: bind(this, function(db) {
          // First pass; check whether collection exists.
          if(!db.objectStoreNames.contains(c)) {
            options.success(null, { local: true });
            return;
          }

          // Second pass; check whether entity exists.
          var store = db.transaction(c, IDBTransaction.READ_WRITE).objectStore(c);
          var tnx = store['delete'](object._id);
          tnx.onsuccess = function() {
            options.success(null, { local: true });
          };
          tnx.onerror = function() {
            options.error({
              error: tnx.error,
              message: tnx.error
            }, { local: true });
          };
        }),
        error: options.error
      });
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    removeWithQuery: function(query, options) {
      options = this._options(options);

      var msg = 'Removal based on a query is not supported by this store.';
      options.error({
        error: msg,
        message: msg
      }, { local: true });
    },

    /**
     * Saves object to the store.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options] Options.
     */
    save: function(object, options) {
      options = this._options(options);

      // Convenience shortcut.
      var c = this.collection;

      this._db({
        success: bind(this, function(db) {
          // First pass, create the collection if not existent. This operation is
          // performed through a versionchange transaction.
          if(!db.objectStoreNames.contains(c)) {
            // Create collection by migrating the database.
            this._migrate(db, function(db) {
              // Command to be executed on versionchange.
              db.createObjectStore(c, { keyPath: '_id' });
            }, {
              success: bind(this, function(db) {
                // Collection created, proceed with saving.
                this._save(db, object, options);
              }),
              error: options.error
            });
          }
          else {
            // Collection already exists, proceed with saving.
            this._save(db, object, options);
          }
        }),
        error: options.error
      });
    },

    /**
     * Returns database handle.
     * 
     * @private
     * @param {Object} options Options.
     */
    _db: function(options) {
      // Return if already openend.
      if(this.database && !options.version) {
        options.success(this.database);
        return;
      }

      // Open database.
      var request = options.version ? indexedDB.open(this.name, options.version) : indexedDB.open(this.name);
      request.onupgradeneeded = bind(this, function() {
        this.database = request.result;
        options.migrate && options.migrate(this.database);
      });
      request.onsuccess = bind(this, function() {
        this.database = request.result;

        // onversionchange is called when another thread migrates the same
        // database. Avoid blocking by closing and unsetting our instance.
        this.database.onversionchange = bind(this, function() {
          request.result.close();
          this.database = null;
        });
        options.success(this.database);
      });
      request.onerror = request.onblocked = function() {
        options.error({
          error: request.error,
          message: request.error
        }, { local: true });
      };
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
     * Returns meta data.
     * 
     * @private
     * @param {string} collection Meta data collection.
     * @param {string} key Record key.
     * @param {Object} options Options.
     */
    _getMeta: function(collection, key, options) {
      this._db({
        success: bind(this, function(db) {
          // First pass; check whether collection exists.
          if(!db.objectStoreNames.contains(collection)) {
            var msg = 'Not found.';
            return options.error({
              error: msg,
              message: msg
            }, { local: true });
          }

          // Second pass; check whether record exists.
          var store = db.transaction(collection).objectStore(collection);
          var tnx = store.get(key);
          tnx.onsuccess = tnx.onerror = function() {
            var msg = 'Not found.';
            null != tnx.result ? options.success(tnx.result, { local: true }) : options.error({
              error: tnx.error || msg,
              message: tnx.error || msg
            }, { local: true });
          };
        }),
        error: options.error
      });
    },

    /**
     * Migrates database.
     * 
     * @private
     * @param {function(database)} command Migration command.
     * @param {Object} options Options.
     */
    _migrate: function(db, command, options) {
      // Increment version number.
      var version = parseInt(db.version || 0, 10) + 1;

      // Earlier versions of the IndexedDB spec defines setVersion as the way
      // to migrate. Later versions require the onupgradeevent. We support both.
      if(db.setVersion) {//old
        var versionRequest = db.setVersion(version);
        versionRequest.onsuccess = function() {
          command(db);
          options.success(db);
        };
        versionRequest.onerror = function() {
          options.error({
            error: versionRequest.error,
            message: versionRequest.error
          }, { local: true });
        };
        return;
      }

      // Otherwise, reopen the database.
      options.migrate = command;
      options.version = version;
      this._db(options);
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
      options.error || (options.error = this.options.error);
      return options;
    },

    /**
     * Saves entity to the store.
     * 
     * @private
     * @param {Object} db Database handle.
     * @param {Object} object Object to be saved.
     * @param {Object} options Options.
     */
    _save: function(db, object, options) {
      var c = this.collection;
      var store = db.transaction(c, IDBTransaction.READ_WRITE).objectStore(c);

      // If entity is new, assign an ID. This is done because IndexedDB uses
      // simple integers, and we need something more robust.
      object._id || (object._id = new Date().getTime().toString());

      // Save to collection.
      var tnx = store.put(object);
      tnx.onsuccess = function() {
        options.success(object, { local: true });
      };
      tnx.onerror = function() {
        options.error({
          error: tnx.error,
          message: tnx.error
        }, { local: true });
      };
    },

    /**
     * Sets meta data.
     * 
     * @private
     * @param {string} collection Meta data collection.
     * @param {Object} object Meta data object.
     * @param {Object} options Options.
     */
    _setMeta: function(collection, object, options) {
      this._db({
        success: bind(this, function(db) {
          // Define handler for storing meta data.
          var progress = bind(this, function(db) {
            var store = db.transaction(collection, IDBTransaction.READ_WRITE).objectStore(collection);
            var tnx = store.put(object);
            tnx.onsuccess = function() {
              options.success(object, { local: true });
            };
            tnx.onerror = function() {
              options.error({
                error: tnx.error,
                message: tnx.error
              }, { local: true });
            };
          });

          // First pass, create the collection if not existent. This operation is
          // performed through a versionchange transaction.
          if(!db.objectStoreNames.contains(collection)) {
            // Create collection by migrating the database.
            this._migrate(db, function(db) {
              // Command to be executed on versionchange.
              db.createObjectStore(collection, { keyPath: 'key' });
            }, { success: progress, error: options.error });
          }
          else {
            progress(db);
          }
        }),
        error: options.error
      });
    }
  }, {
    // Meta data stores.
    AGGREGATION_STORE: '_aggregation',
    QUERY_STORE: '_query'
  });

}());
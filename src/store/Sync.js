(function() {

  /**
   * Kinvey Sync namespace definition. This namespace manages the data
   * synchronization between local and remote backend.
   * 
   * @namespace
   */
  Kinvey.Sync = {

    // Properties.

    /**
     * Environment status.
     * 
     */
    isOnline: navigator.onLine,

    /**
     * Default options.
     * 
     */
    options: {
      conflict: null,
      store: { },
      start: function() { },
      success: function() { },
      error: function() { }
    },

    // Methods.

    /**
     * Configures sync.
     * 
     * @param {Object} options
     * @param {Object} options.store Store options.
     * @param {function(collection, cached, remote, options)} options.conflict
     *          Conflict resolution callback.
     * @param {function()} options.start Start callback.
     * @param {function(status)} options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    configure: function(options) {
      options.conflict && (Kinvey.Sync.options.conflict = options.conflict);
      options.store && (Kinvey.Sync.options.store = options.store);
      options.start && (Kinvey.Sync.options.start = options.start);
      options.success && (Kinvey.Sync.options.success = options.success);
      options.error && (Kinvey.Sync.options.error = options.error);
    },

    /**
     * Sets environment to offline mode.
     * 
     */
    offline: function() {
      Kinvey.Sync.isOnline = false;
    },

    /**
     * Sets environment to online mode. This will trigger synchronization.
     * 
     */
    online: function() {
      if(!Kinvey.Sync.isOnline) {
        Kinvey.Sync.isOnline = true;
        Kinvey.Sync.application();
      }
    },

    /**
     * Synchronizes application.
     * 
     * @param {Object} [options] Options.
     */
    application: function(options) {
      options = Kinvey.Sync._options(options);
      Kinvey.Sync.isOnline ? new Synchronizer(options).application({
        start: Kinvey.Sync.options.start || function() { }
      }) : options.error({
        error: Kinvey.Error.NO_NETWORK,
        description: 'There is no active network connection.',
        debug: 'Synchronization requires an active network connection.'
      });
    },

    /**
     * Synchronizes collection.
     * 
     * @param {string} name Collection name.
     * @param {Object} [options] Options.
     */
    collection: function(name, options) {
      options = Kinvey.Sync._options(options);
      Kinvey.Sync.isOnline ? new Synchronizer(options).collection(name) : options.error({
        error: Kinvey.Error.NO_NETWORK,
        description: 'There is no active network connection.',
        debug: 'Synchronization requires an active network connection.'
      });
    },

    /**
     * Synchronizes object.
     * 
     * @param {string} collection Collection name.
     * @param {Object} object Object.
     * @param {Object} [options] Options.
     */
    object: function(collection, object, options) {
      options = Kinvey.Sync._options(options);
      Kinvey.Sync.isOnline ? new Synchronizer(options).object(collection, object) : options.error({
        error: Kinvey.Error.NO_NETWORK,
        description: 'There is no active network connection.',
        debug: 'Synchronization requires an active network connection.'
      });
    },

    // Built-in conflict resolution handlers.

    /**
     * Client always wins conflict resolution. Prioritizes cached copy over
     * remote copy.
     * 
     * @param {string} collection Collection name.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    clientAlwaysWins: function(collection, cached, remote, options) {
      options.success(cached);
    },

    /**
     * Leaves conflicts as is.
     * 
     * @param {string} collection Collection name.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    ignore: function(collection, cached, remote, options) {
      options.error();
    },

    /**
     * Server always wins conflict resolution. Prioritizes remote copy over
     * cached copy.
     * 
     * @param {string} collection Collection name.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    serverAlwaysWins: function(collection, cached, remote, options) {
      options.success(remote);
    },

    // Helper methods.

    /**
     * Returns complete options object.
     * 
     * @private
     * @param {Object} [options] Options.
     */
    _options: function(options) {
      options || (options = {});
      options.store || (options.store = Kinvey.Sync.options.store);
      options.conflict || (options.conflict = Kinvey.Sync.options.conflict || Kinvey.Sync.ignore);
      options.success || (options.success = Kinvey.Sync.options.success);
      options.error || (options.error = Kinvey.Sync.options.error);
      return options;
    }
  };

  // Listen to browser events to adapt the environment to.
  window.addEventListener('online', Kinvey.Sync.online, false);
  window.addEventListener('offline', Kinvey.Sync.offline, false);

  // Define the Synchronizer class.
  var Synchronizer = Base.extend({
    /**
     * Creates a new synchronizer.
     * 
     * @constructor
     * @name Synchronizer
     * @param {Object} options
     * @param {Object} options.store Store options.
     * @param {function(collection, cached, remote, options)} options.conflict
     *          Conflict resolution callback.
     * @param {function()} options.start Start callback.
     * @param {function(status) options.success Success callback.
     * @param {function(error)} options.error Failure callback.
     */
    constructor: function(options) {
      // Configure.
      this.store = options.store;// AppData store options.
      this.conflict = options.conflict;
      this.success = options.success;
      this.error = options.error;
    },

    /**
     * Synchronizes all application data.
     * 
     * @param {Object} [options]
     * @param {function()} options.start Start callback.
     */
    application: function(options) {
      // Trigger start callback.
      options && options.start && options.start();

      // Retrieve pending transactions.
      new Database(Database.TRANSACTION_STORE).getTransactions({
        success: bind(this, function(transactions) {
          // Prepare response.
          var response = {};

          // If there are no pending transactions, return here.
          var collections = Object.keys(transactions);
          var pending = collections.length;
          if(0 === pending) {
            return this.success(response);
          }

          // There are pending transactions. Define a handler to aggregate the
          // responses per synchronized collection.
          var handler = bind(this, function(collection) {
            return bind(this, function(result) {
              // Add results to response.
              result && (response[collection] = result);

              // When all collections are synchronized, terminate the
              // algorithm.
              !--pending && this.success(response);
            });
          });

          // Synchronizing each collection (in parallel).
          collections.forEach(bind(this, function(collection) {
            this._collection(collection, transactions[collection], handler(collection));
          }));
        }),
        error: this.error
      });
    },

    /**
     * Synchronizes a collection.
     * 
     * @param {string} name Collection name.
     */
    collection: function(name) {
      // Retrieve pending transactions.
      new Database(name).getTransactions({
        success: bind(this, function(transactions) {
          // If there are no pending transactions, return here.
          if(null == transactions[name]) {
            return this.success({});
          }

          // There are pending transactions. Synchronize.
          this._collection(name, transactions[name], bind(this, function(result) {
            // Wrap result in collection property.
            var response = {};
            result && (response[name] = result);

            // Terminate the algorithm.
            this.success(response);
          }));
        }),
        error: this.error
      });
    },

    /**
     * Synchronizes an object.
     * 
     * @param {string} collection Collection name.
     * @param {Object} object Object.
     */
    object: function(collection, object) {
      // Extract object id.
      var id = object._id;

      // Retrieve pending transactions for the collection.
      var db = new Database(collection);
      db.getTransactions({
        success: bind(this, function(transactions) {
          // If there is no pending transaction for this object, return here.
          if(null == transactions[collection] || !transactions[collection].hasOwnProperty(id)) {
            return this.success({});
          }

          // There is a pending transaction. Make sure this is the only
          // transaction we handle.
          var value = transactions[collection][id];
          transactions = {};
          transactions[id] = value;

          // Classify and commit.
          this._classifyAndCommit(collection, transactions, {
            db: db,
            objects: [id],
            store: Kinvey.Store.factory(collection, Kinvey.Store.APPDATA, this.store)
          }, bind(this, function(result) {
            // Wrap result in collection property.
            var response = {};
            response[collection] = result;

            // Terminate the algorithm.
            this.success(response);
          }));
        }),
        error: this.error
      });
    },

    /**
     * Classifies each transaction as committable, conflicted or canceled.
     * 
     * @private
     * @param {string} collection Collection name.
     * @param {Object} transactions Pending transactions.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Array} data.objects Object ids under transaction.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(committable, conflicted, canceled)} complete Complete callback.
     */
    _classify: function(collection, transactions, data, complete) {
      // Retrieve all objects under transaction.
      this._retrieve(data.objects, data, bind(this, function(cached, remote) {
        // Prepare response.
        var committable = {};
        var conflicted = [];

        // Define handler to handle the classification process below.
        var pending = data.objects.length;
        var handler = function(id) {
          return {
            success: function(copy) {
              // The user may have erroneously altered the id, which we
              // absolutely need to undo here.
              copy && (copy._id = id);

              // Add to set and continue.
              committable[id] = copy;
              !--pending && complete(committable, conflicted, []);
            },
            error: function(collection, cached, remote) {
              // Add to set and continue.
              conflicted.push(id);
              !--pending && complete(committable, conflicted, []);
            } 
          };
        };

        // Classify each transaction (in parallel). First, handle objects
        // available both in the store and database.
        remote.forEach(bind(this, function(object) {
          var id = object._id;
          this._object(collection, transactions[id], cached[id], object, handler(id));

          // Housekeeping, remove from cached to not loop it again below.
          delete cached[id];
        }));

        // Next, handle objects only available in the database.
        Object.keys(cached).forEach(bind(this, function(id) {
          this._object(collection, transactions[id], cached[id], null, handler(id));
        }));
      }), function() {// An error occurred. Mark all transactions as cancelled.
        complete([], [], data.objects);
      });
    },

    /**
     * Classifies and commits all transactions for a collection.
     * 
     * @private 
     * @param {string} collection Collection name.
     * @param {Object} transactions Pending transactions.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Array} data.objects Object ids under transaction.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(result)} complete Complete callback.
     */
    _classifyAndCommit: function(collection, transactions, data, complete) {
      this._classify(collection, transactions, data, bind(this, function(committable, conflicted, canceled) {
        this._commit(committable, data, function(committed, cCanceled) {
          // Merge sets and return.
          complete({
            committed: committed,
            conflicted: conflicted,
            canceled: canceled.concat(cCanceled)
          });
        });
      }));
    },

    /**
     * Processes synchronization for collection.
     * 
     * @private
     * @param {string} name Collection name.
     * @param {Object} transactions List of pending transactions.
     * @param {function(result)} complete Complete callback.
     */
    _collection: function(name, transactions, complete) {
      // If there are no pending transactions, return here.
      var objects = Object.keys(transactions);
      if(0 === objects.length) {
        return complete();
      }

      // There are pending transactions. Classify and commit all.
      this._classifyAndCommit(name, transactions, {
        db: new Database(name),
        objects: objects,
        store: Kinvey.Store.factory(name, Kinvey.Store.APPDATA, this.store)
      }, complete);
    },

    /**
     * Commits a series of transactions.
     * 
     * @private
     * @param {Object} objects Objects to commit.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commit: function(objects, data, complete) {
      // If there are no transactions to be committed, return here.
      data.objects = Object.keys(objects);
      if(0 === data.objects.length) {
        return complete([ ], [ ]);
      }

      // There are transactions to be committed. Distinguish between updates
      // and removals.
      var updates = [ ];
      var removals = [ ];
      data.objects.forEach(function(id) {
        var object = objects[id];
        null != object ? updates.push(object) : removals.push(id);
      });

      // Prepare response.
      var committed = [];
      var canceled = [];
      var pending = 2;// Updates and removals.
      var handler = function(partialCommitted, partialCanceled) {
        committed = committed.concat(partialCommitted);
        canceled = canceled.concat(partialCanceled);

        // On complete, remove transactions from database. Failure at this
        // stage is non-fatal.
        if(!--pending) {
          var fn = function() {
            complete(committed, canceled);
          };
          data.db.removeTransactions(committed, {
            success: fn,
            error: fn
          });
        }
      };

      // Commit updates and removals (in parallel).
      this._commitUpdates(updates, data, handler);
      this._commitRemovals(removals, data, handler);
    },

    /**
     * Commits object.
     * 
     * @private
     * @param {Object} object Object to commit.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitObject: function(object, data, complete) {
      // First, commit to the store.
      data.store.save(object, {
        success: function(response) {
          // Next, commit response to database. Failure is non-fatal.
          var fn = function() {
            complete([response._id], []);
          };
          data.db.put('query', response._id, response, {
            success: fn,
            error: fn
          });
        },
        error: function() {
          complete([], [object._id]);
        }
      });
    },

    /**
     * Commits a series of removal transactions.
     * 
     * @private
     * @param {Array} objects Objects to commit.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitRemovals: function(objects, data, complete) {
      // If there are no transactions, return here.
      if(0 === objects.length) {
        return complete([], []);
      }

      // Define remote commit success handler.
      var success = function() {
        // Second step is to commit to the database. Failure is non-fatal.
        var fn = function() {
          complete(objects, []);
        };
        data.db.multiRemove(objects, {
          success: fn,
          error: fn
        });
      };

      // There are transactions to commit. First, commit to the store.
      var query = new Kinvey.Query().on('_id').in_(objects);
      data.store.removeWithQuery(query.toJSON(), {
        success: success,
        error: function(error) {
          // EntityNotFound is our friend, catch here.
          if(Kinvey.Error.ENTITY_NOT_FOUND === error.error) {
            return success();
          }

          // Mark all as canceled and return.
          complete([ ], objects);
        }
      });
    },

    /**
     * Commits a series of update transactions.
     * 
     * @private
     * @param {Array} objects Objects to commit.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitUpdates: function(objects, data, complete) {
      // If there are no transactions, return here.
      if(0 === objects.length) {
        return complete([], []);
      }

      // Prepare response.
      var committed = [ ];
      var canceled = [ ];

      // Define progress handler.
      var pending = objects.length;
      var handler = function(uCommitted, uCanceled) {
        // Add to set and continue.
        committed = committed.concat(uCommitted);
        canceled = canceled.concat(uCanceled);
        !--pending && complete(committed, canceled);
      };

      // Commit each transaction (in parallel).
      objects.forEach(bind(this, function(object) {
        this._commitObject(object, data, handler);
      }));
    },

    /**
     * Processes synchronization for object.
     * 
     * @private
     * @param {string} collection Collection name.
     * @param {string} transaction Transaction timestamp.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(copy)} options.success Success handler.
     * @param {function(collection, cached, remote)} options.error Failure callback.
     */
    _object: function(collection, transaction, cached, remote, options) {
      // If remote copy does not exist, or timestamps match; cached copy wins.
      if(null === remote || transaction === remote._kmd.lmt) {
        return options.success(cached);
      }

      // At this point, cached and remote are in conflicting state. Invoke the
      // conflict resolution callback to resolve the conflict. Optionally, the
      // handler can maintain the conflicting state by triggering the error
      // handler.
      this.conflict(collection, cached, remote, {
        success: options.success,
        error: function() {
          options.error(collection, cached, remote);
        }
      });
    },

    /**
     * Retrieves objects from store and database.
     * 
     * @param {Array} object List of object ids.
     * @param {Object} data
     * @param {Database} data.db Database
     * @param {Kinvey.Store.AppData} data.store Store.
     * @param {function(cached, remote)} success Success callback.
     * @param {function()} error Failure callback.
     */
    _retrieve: function(objects, data, success, error) {
      // Prepare response.
      var cached = [];
      var remote = [];

      // Define handler to handle store and database responses.
      var pending = 2;// store and database.
      var handler = function() {
        return {
          success: function(list, info) {
            // Add to set and continue.
            info.network ? remote = list : cached = list;
            !--pending && success(cached, remote);
          },
          error: function() {
            // Failed to retrieve objects. This is a fatal error.
            error();
            error = function() { };// Unset, to avoid invoking it twice.
          }
        };
      };

      // Retrieve objects (in parallel).
      var query = new Kinvey.Query().on('_id').in_(objects);
      data.store.queryWithQuery(query.toJSON(), handler());
      data.db.multiQuery(objects, handler());
    }
  });
    
}());
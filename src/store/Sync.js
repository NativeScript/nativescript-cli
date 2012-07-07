(function() {

  // Define the Sync class.
  var Sync = Base.extend({
    /**
     * Creates a new synchronization instance.
     * 
     */
    constructor: function() {
      //
    },

    /**
     * Synchronizes all application data.
     * 
     * @param {Object} options
     * @param {function()} options.complete Complete callback.
     */
    app: function(options) {
      // Obtain pending transactions.
      new Database().getTransactions({
        success: bind(this, function(transactions) {
          // Prepare response.
          var response = {};

          // If there are no pending transactions, return here.
          var collections = Object.keys(transactions);
          if(0 === collections.length) {
            return options.complete(response);
          }

          // There are pending transactions. Define handler to aggregate
          // synchronization responses per collection.
          var pending = 0;
          var handler = function(collection) {
            pending += 1;
            return function(result) {
              // Add results to response.
              response[collection] = result;

              // When all collections are synchronized, terminate the algorithm.
              !--pending && options.success(response);
            };
          };

          // Trigger synchronizing per collection (in parallel).
          collections.forEach(bind(this, function(collection) {
            this._collection(collection, transactions[collection], handler(collection));
          }));
        }),
        error: options.error
      });
    },

    collection: function(name, options) { },
    object: function(collection, object, options) { },

    /**
     * Bucketizes all transactions in either committable or conflicted bucket.
     * 
     * @private
     * @param {Object} transactions Transactions.
     * @param {Object} objects
     * @param {Object} objects.cached Cached copies.
     * @param {Array} objects.remote Remote copies.
     * @param {function(committable, conflicted)} complete Complete callback.
     */
    _bucketize: function(transactions, objects, complete) {
      // Prepare response.
      var committable = {};
      var conflicted = [];

      // Define handler to bucketize objects.
      var pending = 0;
      var handler = function(id) {
        pending += 1;
        return {
          success: function(copy) {
            // The user may have erroneously altered the id, which we
            // absolutely need to undo here.
            copy && (copy._id = id);

            // Add to bucket and proceed.
            committable[id] = copy;
            !--pending && complete(committable, conflicted);
          },
          error: function(/*cached, remote*/) {
            // Add to bucket and proceed.
            conflicted.push(id);
            !--pending && complete(committable, conflicted);
          }
        };
      };

      // Bucketize each transaction (in parallel). First, handle objects
      // available both in cached and remote.
      objects.remote.forEach(bind(this, function(object) {
        var id = object._id;
        this._object(transactions[id], objects.cached[id], object, handler(id));

        // Housekeeping; remove from cached objects to avoid looping a second
        // time below.
        delete objects.cached[id];
      }));

      // Next, handle objects only available in cached.
      Object.keys(objects.cached).forEach(bind(this, function(id) {
        this._object(transactions[id], objects.cached[id], null, handler(id));
      }));
    },

    /**
     * Synchronizes collection.
     * 
     * @private
     * @param {string} name Collection name.
     * @param {Object} transactions Pending transactions.
     * @param {function(result)} complete Complete callback.
     */
    _collection: function(name, transactions, complete) {
      // Prepare response.
      var response = {
        committed: [],
        conflicted: [],
        canceled: []
      };

      // If there are no pending transactions, return here.
      var objects = Object.keys(transactions);
      if(0 === objects.length) {
        return complete(response);
      }

      // There are pending transactions. Create cached and remote stores.
      var appdata = Kinvey.Store.factory(name, Kinvey.Store.APPDATA);
      var db = new Database(name);

      // Iterate over transactions.
      this._iterate(transactions, { appdata: appdata, objects: objects, db: db}, {
        // Commit the committable.
        success: bind(this, function(committable, conflicted) {
          this._commit(committable, { appdata: appdata, objects: objects, db: db }, function(committed, canceled) {
            // Gather results, and return.
            response.committed = committed;
            response.conflicted = conflicted;
            response.canceled = canceled;
            complete(response);
          });
        }),

        // Iteration failed. Mark all objects as canceled, and return.
        error: function() {
          response.canceled = objects;
          complete(response);
        }
      });
    },

    /**
     * Commits a series of transactions.
     * 
     * @private
     * @param {Object} transactions Transactions.
     * @param {Object} data
     * @param {Kinvey.Store.AppData} data.appdata AppData store.
     * @param {Database} data.db Database.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commit: function(transactions, data, complete) {
      // If there are no transactions to be committed, return here.
      var objects = Object.keys(transactions);
      if(0 === objects.length) {
        return complete([], []);
      }

      // There are transactions to be committed. Distinguish between updates
      // and removals.
      var updates = [];
      var removals = [];
      objects.forEach(function(id) {
        var transaction = transactions[id];
        null !== transaction ? updates.push(transaction) : removals.push(id);
      });

      // Commit updates first, and removals second.
      this._commitUpdates(updates, data, bind(this, function(uCommitted, uCanceled) {
        this._commitRemovals(removals, data, function(rCommitted, rCanceled) {
          // Merge commit sets.
          var committed = uCommitted.concat(rCommitted);

          // Commit transactions to cached.
          var fn = function() {
            complete(committed, uCanceled.concat(rCanceled));
          };
          data.db.removeTransactions(committed, { success: fn, error: fn });
        });
      }));
    },

    /**
     * Commits a series of removal transactions.
     * 
     * @private
     * @param {Array} transactions Transactions.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Kinvey.Store.AppData} data.appdata AppData store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitRemovals: function(transactions, data, complete) {
      // If there are no transactions, return here.
      if(0 === transactions.length) {
        return complete(transactions, []);
      }

      // There are transactions to commit.
      var query = new Kinvey.Query().on('_id').in_(transactions);
      data.appdata.removeWithQuery(query.toJSON(), {
        success: function() {
          // All is committed to remote, proceed with cached.
          data.db.multiRemove(transactions, {
            success: function() {
              // Mark all as committed.
              complete(transactions, []);
            },
            error: function() {
              // Remote is up to date, which is most important. We can afford
              // ignoring cached.
              complete(transactions, []);
            }
          });
        },
        error: function() {
          // Mark all as canceled and return.
          complete([], transactions);
        }
      });
    },

    /**
     * Commits a series of update transactions.
     * 
     * @private
     * @param {Array} transactions Transactions.
     * @param {Object} data
     * @param {Database} data.cached Database.
     * @param {Kinvey.Store.AppData} data.remote Remote store.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitUpdates: function(transactions, data, complete) {
      // If there are no transactions, return here.
      if(0 === transactions.length) {
        return complete(transactions, []);
      }

      // Prepare response.
      var committed = [];
      var canceled = [];

      // Define progress handler.
      var pending = 0;
      var handler = function() {
        pending += 1;
        return function(uCommitted, uCanceled) {
          committed = committed.concat(uCommitted);
          canceled = canceled.concat(uCanceled);

          // Continue.
          !--pending && complete(committed, canceled);
        };
      };

      // There are transactions to commit.
      transactions.forEach(bind(this, function(transaction) {
        this._commitObject(transaction, data, handler());
      }));
    },

    /**
     * Commits object.
     * 
     * @private
     * @param {Object} object Object to be commited.
     * @param {Object} data
     * @param {Kinvey.Store.AppData} data.appdata AppData store.
     * @param {Database} data.db Database.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _commitObject: function(object, data, complete) {
      // Commit to appdata first.
      data.appdata.save(object, {
        success: function(response) {
          // Object is committed to appdata. Update database, do nothing on
          // failure.
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
     * Iterates over each transaction to bucketize them.
     * 
     * @private
     * @param {Object} transactions Transactions.
     * @param {Object} data
     * @param {Database} data.db Database.
     * @param {Array} data.objects Objects under transaction.
     * @param {Kinvey.Store.AppData} data.appdata AppData store.
     * @param {Object} options
     * @param {function(committable, conflicted)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    _iterate: function(transactions, data, options) {
      // Prepare objects under transaction.
      var cached = [];
      var remote = [];

      // Define handler to bucketize transaction.
      var pending = 0;
      var handler = bind(this, function() {
        pending += 1;
        return {
          success: bind(this, function(list, info) {
            info.network ? remote = list : cached = list;
            !--pending && this._bucketize(transactions, { cached: cached, remote: remote }, options.success); 
          }),
          error: function() {
            // Make sure error handler is only invoked once.
            options.error();
            options.error = function() { };
          }
        };
      });

      // Pull objects under transaction (in parallel).
      var query = new Kinvey.Query().on('_id').in_(data.objects);
      data.appdata.queryWithQuery(query.toJSON(), handler());
      data.db.multiQuery(data.objects, handler());
    },

    /**
     * Synchronizes object.
     * 
     * @private
     * @param {string} transaction Transaction timestamp.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(copy)} options.success Success handler.
     * @param {function(cached, remote)} options.error Failure callback.
     */
    _object: function(transaction, cached, remote, options) {
      // If remote copy does not exist, or timestamps match; proceed.
      if(null === remote || transaction === remote._kmd.lmt) {
        return options.success(cached);
      }

      // At this point, cached and remote are in conflicting state. Invoke the
      // conflict resolution callback to resolve the conflict. Optionally, the
      // handler can maintain the conflicting state by triggering the error
      // handler.
      options.error(cached, remote);
    }
  });

}());
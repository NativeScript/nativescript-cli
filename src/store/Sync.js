(function() {

  // Define the Kinvey.Store.Sync object.
  Kinvey.Store.Sync = {
    /**
     * Network state.
     * 
     */
    isOnline: window.navigator.onLine,

    /**
     * Synchronizes appdata store with cached store.
     * 
     * @param {Object} [options] Options.
     */
    synchronize: function(options) {
      options || (options = {});

      // Set default conflict handler.
      options.conflict || (options.conflict = function(cached, remote, options) {
        // Maintain conflicting state.
        options.error();
      });

      // Only synchronize when network is available.
      if(!Kinvey.Store.Sync.isOnline) {
        options.error && options.error({
          code: Kinvey.Error.NO_NETWORK,
          description: 'Synchronization requires a network connection',
          debug: ''
        });
      }

      // Get transaction log.
      var db = new Kinvey.Store.Local('test-collection');//FIXME
      db.getTransactionLog({
        success: function(changes) {
          // Prepare response.
          var response = {};

          // Changes contains the changed objects per collection. Synchronize
          // in parallel.
          var collections = Object.getOwnPropertyNames(changes);
          if(0 === collections.length) {// Nothing to do.
            return options.success && options.success(response);
          }

          // Define complete callback to trigger when all
          // collections are synchronized.
          var completed = 0;// Number of collections synchronized.
          var complete = function(collection) {
            return function(result) {
              // Result should be an object containing committed, canceled
              // and conflicted objects arrays. Aggregate these here.
              response[collection] = result;

              // If all collections are synchronized, update transaction log and terminate.
              if(++completed === collections.length) {
                db.updateTransactionLog(response, function() {
                  options.success && options.success(response);
                });
              }
            };
          };

          // Trigger synchronization.
          collections.forEach(function(collection) {
            Kinvey.Store.Sync._synchronize(collection, changes[collection], {
              conflict: options.conflict,
              success: complete(collection)
            });
          });
        },
        error: options.error
      });
    },

    /**
     * Bucketizes changes for collection.
     * 
     * @private
     * @param {string} name Collection name.
     * @param {Array} list List of object ids to change.
     * @param {Object} changes List of changes.
     * @param {Object} options
     * @param {Kinvey.Store.Local} options.cached Cached store.
     * @param {Kinvey.Store.AppData} options.remote Remote store.
     * @param {function(cached, remote, options)} options.conflict Conflict handler.
     * @param {function(committed, conflicted)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    _bucketize: function(collection, list, changes, options) {
      // Objects to change.
      var cached = {};// Map of objects, with id as key.
      var remote = [];// List of objects.

      // Define handler to populate objects to change.
      var pending = 2;
      var handler = {
        success: function(response, info) {
          info.network ? remote = response : cached = response;

          // When both stores are done, proceed with actual comparison.
          0 === --pending && Kinvey.Store.Sync._compare(list, changes, cached, remote, {
            complete: options.success,
            conflict: options.conflict
          });
        },
        error: function() {
          // Make sure error handler is only called once.
          options.error();
          options.error = function() { };
        }
      };

      // Pull objects to change from both remote and cached (in parallel).
      var query = new Kinvey.Query().on('_id').in_(list);
      options.remote.queryWithQuery(query.toJSON(), handler);
      options.cached.getById(list, handler);
    },

    /**
     * Commits objects to remote and cached stores.
     * 
     * @private
     * @param {Object} committable List of committable objects.
     * @param {Object} options
     * @param {Kinvey.Store.Local} options.cached Cached store.
     * @param {Kinvey.Store.AppData} options.remote Remote store.
     * @param {function(committed, canceled)} options.complete Complete callback.
     */
    _commit: function(committable, options) {
      // Distinguish between updates and removals.
      var updates = [];// list of objects.
      var removals = [];// list of ids.

      // Bucketize.
      Object.getOwnPropertyNames(committable).forEach(function(id) {
        var value = committable[id];
        null !== value ? updates.push(value) : removals.push(id);
      });

      // Commit update set first.
      Kinvey.Store.Sync._commitUpdates(updates, merge(options, {
        complete: function(uCommitted, uCanceled) {
          // Commit removals second.
          Kinvey.Store.Sync._commitRemovals(removals, merge(options, {
            complete: function(rCommitted, rCanceled) {
              // Merge committed and canceled sets, and return.
              options.complete(uCommitted.concat(rCommitted), uCanceled.concat(rCanceled));
            }
          }));
        }
      }));
    },

    /**
     * Commits object to remote and cached stores.
     * 
     * @private
     * @param {Object} object Object to commit.
     * @param {Object} options
     * @param {Kinvey.Store.Local} options.cached Cached store.
     * @param {Kinvey.Store.AppData} options.remote Remote store.
     * @param {function()} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    _commitObject: function(object, options) {
      // Commit to remote store first.
      options.remote.save(object, {
        success: function(response) {
          // Object is committed to remote store, proceed with cached store.
          // We save the fresh response from remote.
          options.cached.put('query', null, response, {
            success: options.success,

            // Remote is up to date, which is most important. We can afford
            // it to ignore an error here.
            error: options.success
          });
        },
        error: options.error
      });
    },

    /**
     * Commits removals to remote and cached stores.
     * 
     * @private
     * @param {Array} committable List of ids.
     * @param {Object} options
     * @param {Kinvey.Store.Local} options.cached Cached store.
     * @param {Kinvey.Store.AppData} options.remote Remote store.
     * @param {function(committed, canceled)} options.complete Complete callback.
     */
    _commitRemovals: function(committable, options) {
      // Quick way out.
      if(0 === committable.length) {
        return options.complete([], []);
      }

      // Removing objects remotely involves one query only. Do not execute
      // the synchronization in parallel, to avoid data corruption.
      var query = new Kinvey.Query().on('_id').in_(committable);
      options.remote.removeWithQuery(query.toJSON(), {
        success: function() {
          // All is committed to remote store, proceed with cached store.
          options.cached.removeById(committable, {
            success: function() {
              // Mark all as committed.
              options.complete(committable, []);
            },
            error: function() {
              // Remote is up to date, which is most important. We can afford
              // it to ignore an error here.
              options.complete(committable, []);
            }
          });
        },
        error: function() {
          // Mark all as canceled.
          options.complete([], committable);
        }
      });
    },

    /**
     * Commits updates to remote and cached stores.
     * 
     * @private
     * @param {Array} committable List of objects.
     * @param {Object} options
     * @param {Kinvey.Store.Local} options.cached Cached store.
     * @param {Kinvey.Store.AppData} options.remote Remote store.
     * @param {function(committed, canceled)} options.complete Complete callback.
     */
    _commitUpdates: function(committable, options) {
      // Quick way out.
      if(0 === committable.length) {
        return options.complete([], []);
      }

      // Prepare response.
      var committed = [];
      var canceled = [];

      // Commit all updates in parallel. Define a progress handler to check
      // whether no more updates are pending.
      var pending = committable.length;
      var progress = function() {
        0 === --pending && options.complete(committed, canceled);
      };

      // Trigger commit.
      committable.forEach(function(object) {
        Kinvey.Store.Sync._commitObject(object, merge(options, {
          success: function() {
            // Mark as committed and trigger progress handler.
            committed.push(object._id);
            progress();
          },
          error: function() {
            // Mark as canceled and trigger progress handler.
            canceled.push(object._id);
            progress();
          }
        }));
      });
    },

    /**
     * Compares cached and remote changes .
     * 
     * @private
     * @param {Array} list List of object ids to change.
     * @param {Object} changes List of changes.
     * @param {Array} cached List of cached copies.
     * @param {Array} remote List of remote copies.
     * @param {Object} options
     * @param {function(committable, conflicted)} options.complete Complete callback.
     * @param {function(cached, remote, options)} options.conflict Conflict handler.
     */
    _compare: function(list, changes, cached, remote, options) {
      // Prepare response.
      var committable = {};
      var conflicted = [];

      // All changes are compared in parallel. Define progress handler.
      var pending = list.length;
      var progress = function(id) {
        return {
          conflict: options.conflict,

          success: function(object) {
            // The user may have erroneously altered the id, which we
            // absolutely need to undo here.
            object && (object._id = id);

            // Add to committable bucket.
            committable[id] = object;

            // Trigger progress.
            0 === --pending && options.complete(committable, conflicted);
          },
          error: function(/*cached, remote*/) {
            // Add to conflicted.
            conflicted.push(id);

            // Trigger progress.
            0 === --pending && options.complete(committable, conflicted);
          }
        };
      };

      // Handle objects available both in cached and remote.
      remote.forEach(function(object) {
        var id = object._id;

        // Invoke comparison function.
        Kinvey.Store.Sync._compareObject(changes[id], cached[id], object, progress(id));
        delete changes[id];// Remove from changes to avoid looping twice (see below).
      });

      // Handle objects only available in cached.
      Object.getOwnPropertyNames(cached).forEach(function(id) {
        // Invoke comparison function.
        Kinvey.Store.Sync._compareObject(changes[id], cached[id], null, progress(id));
      });
    },

    /**
     * Compares cached and remote object. The success handler is invoked
     * with the preferred version. On conflict, the error handler is
     * invoked.
     * 
     * @private
     * @param {Object} change Change object.
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options
     * @param {function(object)} options.success Success callback.
     * @param {function(cached, remote)} options.error Failure callback.
     */
    _compareObject: function(change, cached, remote, options) {
      // If remote copy does not exist, or timestamps match: proceed.
      if(null === remote || change === remote._kmd.lmt) {
        return options.success(cached);
      }

      // At this point, cached and remote are in conflicting state. Invoke the
      // conflict resolution callback to resolve the conflict. Optionally, the
      // handler can maintain the conflicting state by triggering the error
      // handler.
      options.conflict(cached, remote, {
        success: options.success,
        error: function() {
          options.error(cached, remote);
        }
      });
    },

    /**
     * Synchronizes collection.
     * 
     * @private
     * @param {string} collection Collection name.
     * @param {Object} changes List of changed objects.
     * @param {Object} options
     * @param {function(cached, remote, options)} options.conflict Conflict handler.
     * @param {function()} options.success Success callback.
     */
    _synchronize: function(collection, changes, options) {
      // Obtain list of ids from changes.
      var list = Object.keys(changes);
      if(0 === list.length) {// Nothing to do.
        return options.success({});
      }

      // Create collection stores to synchronize.
      var remote = new Kinvey.Store.AppData(collection);
      var cached = new Kinvey.Store.Local(collection);

      // Obtain the committable and conflicted changes.
      Kinvey.Store.Sync._bucketize(collection, list, changes, {
        remote: remote,
        cached: cached,

        conflict: options.conflict,

        // Commit the committable set.
        success: function(committable, conflicted) {
          Kinvey.Store.Sync._commit(committable, {
            remote: remote,
            cached: cached,

            // Merge all result sets and terminate synchronization.
            complete: function(committed, canceled) {
              options.success({
                committed: committed,
                canceled: canceled,
                conflicted: conflicted
              });
            }
          });
        },

        // On error, mark all objects as canceled.
        error: function() {
          options.success({
            committed: [],
            canceled: list,
            conflicted: []
          });
        }
      });
    },

    // Built-in conflict resolution handlers.
    /**
     * Client always wins conflict resolution. Prioritizes cached copy over
     * remote copy.
     * 
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options Options.
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    clientAlwaysWins: function(cached, remote, options) {
      options.success(cached);
    },

    /**
     * Server always wins conflict resolution. Prioritizes remote copy over
     * cached copy.
     * 
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options Options.
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    serverAlwaysWins: function(cached, remote, options) {
      options.success(remote);
    }
  };

  // Keep track of the network state.
  window.addEventListener('offline', function() {
    Kinvey.Store.Sync.isOnline = false;
  }, false);
  window.addEventListener('online', function() {
    Kinvey.Store.Sync.isOnline = true;
    Kinvey.Store.Sync.synchronize();
  }, false);

}());
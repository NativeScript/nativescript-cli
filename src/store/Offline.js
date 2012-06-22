(function() {

  // Define the Kinvey.Store.Offline class.
  Kinvey.Store.Offline = Kinvey.Store.Cached.extend({
    /**
     * Creates a new offline store.
     * 
     * @name Kinvey.Store.Offline
     * @constructor
     * @extends Kinvey.Store.Cached
     * @param {string} collection Collection.
     * @param {Object} [options] Options.
     */
    constructor: function(collection, options) {
      // Options. By default, no conflict resolution algorithm is defined.
      this.options.conflict = Kinvey.Store.Offline.ignore;

      // Call parent constructor.
      Kinvey.Store.Cached.prototype.constructor.call(this, collection, options);
    },

    /** @lends Kinvey.Store.Offline# */

    /**
     * Configures store.
     * 
     * @override
     * @see Kinvey.Store.Cached#configure
     * @param {Object} options Options.
     * @param {function(cached, remote, options)} [options.conflict]
     *          Conflict handler.
     */
    configure: function(options) {
      Kinvey.Store.Cached.prototype.configure.call(this, options);
      options.conflict && (this.options.conflict = options.conflict);
    },

    /**
     * Removes object from the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#remove
     */
    remove: function(object, options) {
      options = this._options(options);
      this.cached.remove(object, this._wrap(options));
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#removeWithQuery
     */
    removeWithQuery: function(query, options) {
      // Cache removal by query is not supported, hence no synchronization is
      // performed.
      Kinvey.Store.Cached.prototype.removeWithQuery.call(this, query, options);
    },

    /**
     * Saves object to the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#save
     */
    save: function(object, options) {
      options = this._options(options);
      this.cached.save(object, this._wrap(options));
    },

    /**
     * Synchronizes network store with cached store.
     * 
     * @param {Object} [options] Options.
     */
    synchronize: function(options) {
      options = this._options(options);

      // Pull changes from cached.
      this.cached.getTransactionLog({
        success: bind(this, function(data) {
          // Pull all "stale" objects from remote.
          var query = new Kinvey.Query();
          query.on('_id').in_(Object.keys(data.changes));

          this.network.queryWithQuery(query.toJSON(), {
            success: bind(this, function(response) {
              // Compare objects and bucketize changes.
              this._bucketize(data.changes, response, {
                // Conflict resolution handler.
                conflict: options.conflict,

                // After bucketizing, it is time for the actual
                // synchronization.
                complete: bind(this, function(commit, conflicted) {
                  this._synchronize(commit, function(committed, canceled) {
                    // After synchronization, notify observer of results and
                    // terminate synchronization algorithm.
                    data.observer(committed, conflicted, canceled, {
                      success: function() {
                        // Trigger application success handler, passing the
                        // results of the synchronization algorithm.
                        options.success({
                          committed: committed.length,
                          conflicted: conflicted.length,
                          canceled: canceled.length
                        }, { offline: true });
                      },
                      error: options.error// Observer failed.
                    });
                  });
                })
              });
            }),
            error: options.error// Failed to pull objects from remote.
          });
        }),
        error: options.error// Failed to get changes.
      });
    },

    /**
     * Bucketizes changes into the committable or conflicted bucket.
     * 
     * @private
     * @param {Object} changes List of changes.
     * @param {Object} objects List of original objects, now changed.
     * @param {Object} options Options.
     */
    _bucketize: function(changes, objects, options) {
      // Extract list of ids.
      var ids = Object.keys(changes);

      // Quick way out if there are no changes.
      if(0 === ids.length) {
        options.complete([], []);
      }

      // Define handler to be invoked for each object compared.
      var done = function(id) {
        // commitSet contains the desired final state of changed objects.
        var commit = {};
        var conflicted = [ ];// list of ids.
        var pending = ids.length;

        // Return options object.
        return {
          // Conflict resolution handler.
          conflict: options.conflict,

          // Handlers.
          success: function(object) {
            // The user may have erroneously altered the id, which we
            // absolutely need to undo here.
            object && (object._id = id);

            // Add to committable bucket.
            commit[id] = object;
            0 === --pending && options.complete(commit, conflicted);
          },
          error: function(/* cached, remote */) {
            // Add to conflict bucket.
            conflicted.push(id);
            0 === --pending && options.complete(commit, conflicted);
          }
        };
      };

      // Handle objects available both in cache and remotely.
      objects.forEach(bind(this, function(object) {
        var id = object._id;

        // Invoke compare function, and remove from changes.
        this._compare(changes[id], object, done(id));
        delete changes[id];
      }));

      // Handle objects only available in cache.
      Object.keys(changes).forEach(bind(this, function(id) {
        // Invoke compare function, and remove from changes.
        this._compare(changes[id], null, done(id));
        delete changes[id];
      }));
    },

    /**
     * Compares cached and remote object. The success handler is invoked
     * with the preferred version. On conflict, the error handler is
     * invoked.
     * 
     * @private
     * @param {Object} cached Cached object.
     * @param {Object} remote Remote object.
     * @param {Object} options Options.
     * @param {function(object)} options.success Success callback.
     * @param {function(cached, remote, success)} options.conflict Conflict
     *          resolution callback.
     * @param {function(cached, remote)} options.error Failure callback.
     */
    _compare: function(cached, remote, options) {
      // If remote object does not exist, or timestamps match; proceed.
      if(null === remote || cached.ts === remote._kmd.lmt) {
        return options.success(cached.value);
      }

      // At this point, cached and remote are not equal: conflict. Call
      // conflict
      // resolution callback to resolve the conflict. Optionally, the
      // handler
      // can maintain the conflicting state by triggering the error handler.
      var fnError = options.error;
      options.error = function() {
        fnError(cached.value, remote);
      };
      options.conflict(cached.value, remote, options);
    },

    /**
     * Returns complete options object.
     * 
     * @private
     * @override
     * @see Kinvey.Store.Cached#_options
     */
    _options: function(options) {
      options = Kinvey.Store.Cached.prototype._options.call(this, options);

      // Always involve cache when reading. For write operations, this
      // setting means all network responses are always cached. Which is good :)
      var accepted = [
        Kinvey.Store.Cached.NETWORK_FIRST,
        Kinvey.Store.Cached.CACHE_FIRST,
        Kinvey.Store.Cached.BOTH
      ];
      -1 !== accepted.indexOf(options.policy) || (options.policy = Kinvey.Store.Cached.CACHE_FIRST);

      // Conflict resolution handler.
      options.conflict || (options.conflict = this.options.conflict);

      return options;
    },

    /**
     * Pushes removals to both cached and remote store.
     * 
     * @private
     * @param {Array} removals List of removals.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _pushRemovals: function(removals, complete) {
      // Quick way out if there are no removals.
      if(0 === removals.length) {
        return complete([ ], [ ]);
      }

      // Remove objects remotely is done using one operation.
      var query = new Kinvey.Query();
      query.on('_id').in_(removals);

      this.network.removeWithQuery(query.toJSON(), {
        success: bind(this, function() {
          // All are committed, update cache.
          var remove = bind(this, function(i) {
            var id = removals[i++];
            if(id) {
              // Remove object from cache.
              this.cached.put('query', id, null, {
                // Advance with next object.
                success: function() {
                  remove(i);
                },
                error: function() {
                  remove(i);
                }
              });
            }
            else {
              // All are completed.
              complete(removals, [ ]);
            }
          });

          // Trigger cache removal.
          remove(0);
        }),
        error: function() {
          // All are canceled.
          complete([ ], removals);
        }
      });
    },

    /**
     * Pushes updates to both cached and remote store.
     * 
     * @private
     * @param {Array} updates List of updates.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _pushUpdates: function(updates, complete) {
      // Prepare response.
      var committed = [ ];
      var canceled = [ ];

      // Define handler to push a single update.
      var update = bind(this, function(i) {
        var object = updates[i];
        if(object) {
          // Save to cached store, so cache will get updated.
          Kinvey.Store.Cached.prototype.save.call(this, object, {
            success: function(_, info) {
              committed.push(object._id);
            },
            error: function() {
              canceled.push(object._id);
            },
            complete: function() {
              // Advance with next object.
              update(i + 1);
            }
          });
        }
        else {
          // All updates are pushed.
          complete(committed, canceled);
        }
      });

      // Trigger updates.
      update(0);
    },

    /**
     * Synchronizes set.
     * 
     * @private
     * @param {Object} set Committable set.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _synchronize: function(set, complete) {
      // Divide in updates, and removals.
      var updates = [ ];// list of objects.
      var removals = [ ];// list of ids.

      // Bucketize once again.
      Object.getOwnPropertyNames(set).forEach(function(id) {
        var value = set[id];
        null !== value ? updates.push(value) : removals.push(id);
      });

      // Synchronize per set.
      this._pushUpdates(updates, bind(this, function(uCommitted, uCanceled) {
        this._pushRemovals(removals, bind(this, function(rCommitted, rCanceled) {
          complete(uCommitted.concat(rCommitted), uCanceled.concat(rCanceled));
        }));
      }));
    },

    /**
     * Wraps success and error handlers to trigger synchronization.
     * 
     * @private
     * @param {Object} options Options.
     * @return {Object}
     */
    _wrap: function(options) {
      var fnError = options.error;
      var fnSuccess = options.success;
      options.success = bind(this, function(response) {
        fnSuccess(response, { offline: true });
        this.synchronize({
          success: function(status) {
            options.complete(status);
          },
          error: function() {
            options.complete();
          }
        });
      });
      options.error = function(error) {
        fnError(error, { offline: true });
        options.complete();
      };
      return options;
    }
  }, {
    /** @lends Kinvey.Store.Offline */

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
    clientAlwaysWins: function(cached, _, options) {
      options.success(cached);
    },

    /**
     * Do not resolve conflicts. This leaves both copies in a conflicting
     * state.
     * 
     * @param {Object} cached Cached copy.
     * @param {Object} remote Remote copy.
     * @param {Object} options Options.
     * @param {function(copy)} options.success Success callback.
     * @param {function()} options.error Failure callback.
     */
    ignore: function(_, __, options) {
      options.error();
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
  });

}());
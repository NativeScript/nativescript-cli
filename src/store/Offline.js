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
      this.options.conflict = null;

      // Call parent constructor.
      Kinvey.Store.Cached.prototype.constructor.call(this, collection, options);
    },

    /** @lends Kinvey.Store.Offline# */

    /**
     * Removes object from the store.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options] Options.
     */
    remove: function(object, options) {
      options = this._options(options);
      this.cached.remove(object, this._wrap(options));
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    removeWithQuery: function(query, options) {
      // Removal by query is not supported locally, so no synchronization is
      // performed.
      Kinvey.Store.Cached.prototype.removeWithQuery.call(this, query, options);
    },

    /**
     * Saves object to the store.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options] Options.
     */
    save: function(object, options) {
      options = this._options(options);
      this.cached.save(object, this._wrap(options));
    },

    /**
     * Synchronizes network and cached store.
     * 
     * @param {Object} [options] Options.
     */
    synchronize: function(options) {
      options = this._options(options);

      // Pull changes from cached.
      this.cached.getTransactionLog({
        success: bind(this, function(data) {
          // Pull "stale" objects from remote.
          var query = new Kinvey.Query();
          query.on('_id').in_(Object.keys(data.changes));

          this.network.queryWithQuery(query.toJSON(), {
            success: bind(this, function(response) {
              // Compare objects and bucketize changes.
              this._bucketize(data.changes, response, {
                complete: bind(this, function(commit, conflicted) {
                  // After bucketizing, it is time for the actual synchronization.
                  this._synchronize(commit, function(committed, canceled) {
                    // On completion, notify observer of changes made and
                    // terminate synchronization algorithm.
                    data.observer(committed, conflicted, canceled, {
                      success: function(_, info) {
                        options.success({
                          committed: committed.length,
                          conflicted:  conflicted.length,
                          canceled: canceled.length
                        }, info);
                      },
                      error: options.error
                    });
                  });
                }),
                conflict: options.conflict
              });
            }),
            error: options.error
          });
        }),
        error: options.error
      });
    },

    /**
     * Bucketizes changes into three buckets: commit, conflict or cancel.
     * 
     * @private
     * @param {Object} changes List of changes.
     * @param {Object} objects List of original objects, now changed.
     * @param {Object} options Options.
     */
    _bucketize: function(changes, objects, options) {
      // Extract list of ids.
      var ids = Object.keys(changes);

      // Define done callback, which will be invoked for each object compared.
      var done = function(id) {
        // commitSet contains the desired final state of all changed objects.
        var commit = {};
        var conflicted = [];// list of ids.
        var pending = ids.length;

        // Return options object.
        return {
          // Conflict resolution handler.
          conflict: options.conflict,

          // Handlers.
          success: function(object) {
            // The user may have erroneously altered the id, which we absolutely
            // need to undo here.
            object && (object._id = id);

            // Synchronize sets upon completion.
            commit[id] = object;
            if(0 === --pending) {
              return options.complete(commit, conflicted);
            }
         },
          error: function(/*cached, remote*/) {
            // Synchronize sets upon completion.
            conflicted.push(id);
            if(0 === --pending) {
              return options.complete(commit, conflicted);
            }
          }
        };
      };

      // Handle objects available both locally and remotely.
      objects.forEach(bind(this, function(object) {
        var id = object._id;

        // Invoke compare function, and remove from changes.
        this._compare(changes[id], object, done(id));
        delete changes[id];
      }));

      // Handle objects only available locally.
      Object.keys(changes).forEach(bind(this, function(id) {
        // Invoke compare function, and remove from changes.
        this._compare(changes[id], null, done(id));
        delete changes[id];
      }));
    },

    /**
     * Compares cached and remote object. The success handler is invoked with
     * the preferred version. On conflict, the error handler is invoked.
     * 
     * @private
     * @param {Object} cached Cached object.
     * @param {Object} remote Remote object.
     * @param {Object} options Options.
     * @param {function(object)} options.success Success callback.
     * @param {function(cached, remote, success)} options.conflict Conflict resolution callback.
     * @param {function(cached, remote)} options.error Failure callback.
     */
    _compare: function(cached, remote, options) {
      // If remote object does not exist, or timestamps match; proceed.
      if(null === remote || cached.ts === remote._kmd.lmt) {
        return options.success(cached.value);
      }

      // At this point, timestamps are not equal. Hence a conflict is being
      // detected. Invoke a resolution algorithm if specified, otherwise
      // return in a erroneous state.
      if(options.conflict) {
        return options.conflict(cached.value, remote, options.success);
      }
      return options.error(cached.value, remote);
    },

    /**
     * @override
     */
    _options: function(options) {
      options = Kinvey.Store.Cached.prototype._options.call(this, options);

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
        return complete([], []);
      }

      // Remove remotely can be done in one call.
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
                success: function() { remove(i); },
                error: function() { remove(i); }
              });
            }
            else {
              // All are completed.
              complete(removals, []);
            }
          });

          // Trigger cache removal.
          remove(0);
        }),
        error: function() {
          // All are canceled.
          complete([], removals);
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
      var committed = [];
      var canceled = [];

      // Define handler to push a single update.
      var update = bind(this, function(i) {
        var object = updates[i];
        if(object) {
          // Save to cached store, so cache will also be updated.
          Kinvey.Store.Cached.prototype.save.call(this, object, {
            policy: Kinvey.Store.Cached.BOTH,// make sure copy is saved.
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
      var updates = [];// list of objects.
      var removals = [];// list of ids.

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
     * Wraps success and error handlers to include synchronization and
     * oncomplete support.
     * 
     * @private
     * @param {Object} options Options.
     * @return {Object}
     */
    _wrap: function(options) {
      // Extend success handler to synchronize stores.
      var fnError = options.error;
      var fnSuccess = options.success;
      options.success = bind(this, function(response, info) {
        fnSuccess(response, info);
        this.synchronize({
          success: function() { console.log(arguments); options.complete(); },
          error: function() { options.complete(); }
        });
      });
      options.error = function(error, info) {
        fnError(error, info);
        options.complete();
      };
      return options;
    }
  }, {
    // Built-in conflict resolution handlers.
    clientAlwaysWins: function(cached, _, complete) {
      // Client always wins, so simply return the cached version.
      complete(cached);
    },
    serverAlwaysWins: function(_, remote, complete) {
      // Server always wins, so simply return the remote version.
      complete(remote);
    }
  });

}());
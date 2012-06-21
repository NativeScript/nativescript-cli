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
          // Synchronize updates.
          this._synchronizeUpdates(data.updates, bind(this, function(uCommitted, uCanceled) {
            // Synchronize removals.
            this._synchronizeRemovals(data.removals, function(rCommitted, rCanceled) {
              // Merge result sets.
              var committed = uCommitted.concat(rCommitted);
              var canceled = uCanceled.concat(rCanceled);

              // Notify observer.
              data.observer(committed, canceled, {
                success: function(_, info) {
                  options.success(null, info);
                },
                error: options.error
              });
            });
          }));
        }),
        error: options.error
      });
    },

    /**
     * Removes specified objects from the network store.
     * 
     * @private
     * @param {Array} removals Objects to be removed.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _synchronizeRemovals: function(removals, complete) {
      // Save a network request when there is nothing to be removed.
      if(0 === removals.length) {
        return complete([], []);
      }

      // Build list of ids.
      var list = [];
      removals.forEach(function(object) {
        list.push(object._id);
      });

      // Remove all objects at once.
      var query = new Kinvey.Query();
      query.on('_id').in_(list);
      this.network.removeWithQuery(query, {
        success: function() {
          // Mark all as committed.
          complete(list, []);
        },
        error: function() {
          // Mark all as canceled.
          complete([], list);
        }
      });
    },

    /**
     * Updates specified objects at the network store.
     * 
     * @private
     * @param {Array} updates Objects to be updated.
     * @param {function(committed, canceled)} complete Complete callback.
     */
    _synchronizeUpdates: function(updates, complete) {
      // Prepare sets.
      var committed = [];
      var canceled = [];

      // Define update handle.
      var updater = bind(this, function(i) {
        var object = updates[i];
        if(object) {
          // Define complete handle, which advances to the next object to sync.
          var next = function() { updater(i + 1); };

          // Synchronize object.
          this.network.save(object, {
            success: bind(this, function(response) {
              // Add to set.
              committed.push(response._id);

              // Since network store is the primary store, we need to update
              // the cached version.
              this.cached.put('query', null, response, {
                success: next,
                error: next
              });
            }),
            error: function() {// add to set and advance.
              canceled.push(object._id);
              next();
            }
          });
        }
        else {// no more updates.
          complete(committed, canceled);
        }
      });

      // Trigger synchronization.
      updater(0);
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
          success: function() { options.complete(); },
          error: function() { options.complete(); }
        });
      });
      options.error = function(error, info) {
        fnError(error, info);
        options.complete();
      };
      return options;
    }
  });

}());
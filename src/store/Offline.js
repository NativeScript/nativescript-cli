(function() {

  // Define the Kinvey.Store.Offline class.
  Kinvey.Store.Offline = Kinvey.Store.Cached.extend({
    // Store name.
    name: Kinvey.Store.OFFLINE,

    /**
     * Creates a new offline store.
     * 
     * @name Kinvey.Store.Offline
     * @constructor
     * @extends Kinvey.Store.Cached
     * @param {string} collection Collection.
     * @param {Object} [options] Options.
     * @throws {Error} On usage with User API.
     */
    constructor: function(collection, options) {
      // The User API cannot be used offline for security issues.
      if(Kinvey.Store.AppData.USER_API === collection) {
        throw new Error('The User API cannot be used with OfflineStore');
      }

      // Call parent constructor.
      Kinvey.Store.Cached.prototype.constructor.call(this, collection, options);
    },

    /** @lends Kinvey.Store.Offline# */

    /**
     * Configures store.
     * 
     * @override
     * @see Kinvey.Store.Cached#configure
     * @param {Object} options
     * @param {function(collection, cached, remote, options)} [options.conflict]
     *          Conflict resolution handler.
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
      this.db.remove(object, this._wrap(object, options));
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#removeWithQuery
     */
    removeWithQuery: function(query, options) {
      options = this._options(options);
      this.db.removeWithQuery(query, this._wrap(null, options));
    },

    /**
     * Saves object to the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#save
     */
    save: function(object, options) {
      options = this._options(options);
      this.db.save(object, this._wrap(object, options));
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

      // Override the caching policy when offline.
      if(!Kinvey.Sync.isOnline) {
        options.policy = Kinvey.Store.Cached.CACHE_ONLY;
      }
      return options;
    },

    /**
     * Wraps success and error handlers to include synchronization.
     * 
     * @private
     * @param {Object} scope Synchronization scope.
     * @param {Object} options Options.
     * @return {Object}
     */
    _wrap: function(scope, options) {
      // Wrap options for handling synchronization.
      return merge(options, {
        success: bind(this, function(response) {
          options.success(response, { offline: true });

          // If the scope parameter is defined, use the response to scope the
          // the synchronization to this object only. 
          var opts = {
            conflict: options.conflict,
            success: options.complete,
            error: options.complete
          };
          if(scope) {
            // Fallback to scope itself if response is null.
            return Kinvey.Sync.object(this.collection, response || scope, opts);
          }

          // No scope, synchronize the whole collection.
          Kinvey.Sync.collection(this.collection, opts);
        }),
        error: function(error) {// Cannot perform synchronization, so terminate.
          options.error(error, { offline: true });
          options.complete();
        }
      });
    }
  });

}());
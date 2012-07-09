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
     * @param {function(cached, remote, options)} [options.conflict]
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
      this.id = object._id;
      options = this._options(options);
      this.db.remove(object, this._wrap(options));
    },

    /**
     * Removes multiple objects from the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#removeWithQuery
     */
    removeWithQuery: function(query, options) {
      options = this._options(options);
      this.db.removeWithQuery(query, this._wrap(options));
    },

    /**
     * Saves object to the store.
     * 
     * @override
     * @see Kinvey.Store.Cached#save
     */
    save: function(object, options) {
      options = this._options(options);
      this.db.save(object, this._wrap(options));
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

      // Override the cache policy when offline.
//      if(!Kinvey.Store.Sync.isOnline) {
        options.policy = Kinvey.Store.Cached.CACHE_ONLY;
//      }

      return options;
    },

    /**
     * Wraps success and error handlers to trigger synchronization.
     * 
     * @private
     * @param {Object} options Options
     * @return {Object}
     */
    _wrap: function(options) {
      var fnError = options.error;
      var fnSuccess = options.success;
      options.success = bind(this, function(response) {
        fnSuccess(response, { offline: true });

        // Trigger synchronization.
        new Sync().object(this.collection, response ? response._id : this.id, {
          success: function(status) {
            options.complete(status);
          },
          error: function() {
            options.complete({});
          }
        });
      });
      options.error = function(error) {
        fnError(error, { offline: true });
        options.complete();
      };
      return options;
    }
  });

}());
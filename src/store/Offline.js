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

        // Synchronize network with cached.
        this.cached.sync(this.network, {
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
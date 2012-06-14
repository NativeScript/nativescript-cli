(function() {

  // Define the Kinvey.Store.Sync class.
  Kinvey.Store.Sync = Base.extend({
    // Default options.
    options: {
      error: function() { },
      success: function() { }
    },

    // Sources.
    local: null,
    network: null,

    /**
     * Creates a new sync store.
     * 
     * @name Kinvey.Store.Sync
     * @constructor
     * @param {string} collection Collection.
     * @param {Object} [options] Options.
     */
    constructor: function(collection, options) {
      this.local = new Kinvey.Store.Local(collection);
      this.network = new Kinvey.Store.AppData(collection);

      // Options.
      options && this.configure(options);
    },

    /**
     * Aggregates objects from the store.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Object} [options] Options.
     */
    aggregate: function(aggregation, options) {
      options = this._options(options);
      this.network.aggregate(aggregation, options);
    },

    /**
     * Configures store.
     * 
     * @param {Object} options Options.
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
      this.network.login(object, options);
    },

    /**
     * Queries the store for a specific object.
     * 
     * @param {string} id Object id.
     * @param {Object} [options] Options.
     */
    query: function(id, options) {
      options = this._options(options);

      // Flag used for minimizing local database access.
      var hasLocal = false;

      // Define the handler to query remotely.
      var remote = bind(this, function() {
        this.network.query(id, {
          success: bind(this, function(response, info) {
            // Notify application.
            options.success(response, info);

            // Save locally in the background.
            this.local.save(response);
          }),
          error: bind(this, function(error, info) {
            // Notify application.
            options.error(error, info);

            // Remove locally in the background (if existent).
            hasLocal && this.local.remove({ _id: id });
          })
        });
      });

      // First, query the local interface.
      this.local.query(id, {
        success: function(response, info) {
          // Item available locally, notify application.
          info.cache = true;
          options.success(response, info);
          hasLocal = true;

          // Trigger remote handler.
          remote();
        },
        error: remote
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

      // Query remotely.
      this.network.queryWithQuery(query, {
        success: bind(this, function(response, info) {
          options.success(response, info);

          // Save locally in the background.
          response.forEach(bind(this, function(object) {
            this.local.save(object);
          }));
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

      // Remove remotely.
      this.network.remove(object, {
        success: bind(this, function(response, info) {
          // Notify application.
          options.success(response, info);

          // Remove locally in the background.
          this.local.remove(object);
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
      this.network.removeWithQuery(query, options);
    },

    /**
     * Saves object to the store.
     * 
     * @param {Object} object Object to be saved.
     * @param {Object} [options] Options.
     */
    save: function(object, options) {
      options = this._options(options);

      // Save remotely.
      this.network.save(object, {
        success: bind(this, function(response, info) {
          // Notify application.
          options.success(response, info);

          // Save locally in the background.
          this.local.save(response);
        }),
        error: options.error
      });
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
    }
  });

}());
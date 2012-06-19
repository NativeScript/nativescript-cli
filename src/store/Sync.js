(function() {

  // Define the Kinvey.Store.Sync class.
  Kinvey.Store.Sync = Base.extend({
    // Default options.
    options: {
      policy: null,
      complete: function() { },
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
      this.options.policy = Kinvey.Store.Sync.NETWORK_FIRST;// default
      options && this.configure(options);
    },

    /** @lends Kinvey.Store.Sync# */

    /**
     * Aggregates objects from the store.
     * 
     * @param {Object} aggregation Aggregation object.
     * @param {Object} [options] Options.
     */
    aggregate: function(aggregation, options) {
      options = this._options(options);
      this._read('aggregate', aggregation, options);
    },

    /**
     * Configures store.
     * 
     * @param {Object} options Options.
     * @param {integer} [options.policy] Cache policy.
     * @param {function()} [options.complete] Complete callback.
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    configure: function(options) {
      options.complete && (this.options.complete = options.complete);
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
      options.policy && (this.options.policy = options.policy);
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
      this._read('query', id, options);
    },

    /**
     * Queries the store for multiple objects.
     * 
     * @param {Object} query Query object.
     * @param {Object} [options] Options.
     */
    queryWithQuery: function(query, options) {
      options = this._options(options);
      this._read('queryWithQuery', query, options);
    },

    /**
     * Removes object from the store.
     * 
     * @param {Object} object Object to be removed.
     * @param {Object} [options] Options.
     */
    remove: function(object, options) {
      options = this._options(options);

      // Extend success handler to synchronize stores.
      var fnError = options.error;
      var fnSuccess = options.success;
      options.success = bind(this, function(response, info) {
        fnSuccess(response, info);

        // Synchronize network with local.
        var complete = function() { options.complete(); };
        this.local.sync(this.network, {
          success: complete,
          error: complete
        });
      });
      options.error = function(error, info) {
        fnError(error, info);
        options.complete();
      };
      this.local.remove(object, options);
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

      // Extend success handler to synchronize stores.
      var fnError = options.error;
      var fnSuccess = options.success;
      options.success = bind(this, function(response, info) {
        fnSuccess(response, info);

        // Synchronize network with local.
        var complete = function() { options.complete(); };
        this.local.sync(this.network, {
          success: complete,
          error: complete
        });
      });
      options.error = function(error, info) {
        fnError(error, info);
        options.complete();
      };
      this.local.save(object, options);
    },

    /**
     * Returns complete options object.
     * 
     * @private
     * @param {Object} options Options.
     * @return {Object} Options.
     */
    _options: function(options) {
      options || (options = {});
      'undefined' !== typeof options.policy || (options.policy = this.options.policy);
      options.complete || (options.complete = this.options.complete);
      options.success || (options.success = this.options.success);
      options.error || (options.error = this.options.error);
      return options;
    },

    /**
     * Performs read operation, according to the caching policy.
     * 
     * @private
     * @param {string} operation Operation. One of aggregation, query or
     *          queryWithQuery.
     * @param {*} arg Operation argument.
     * @param {Object} options Options.
     */
    _read: function(operation, arg, options) {
      // Extract primary and secondary store from cache policy.
      var networkFirst = this._shouldCallNetworkFirst(options.policy);
      var primaryStore = networkFirst ? this.network : this.local;
      var secondaryStore = networkFirst ? this.local : this.network;

      // Extend success handler to cache network response.
      var invoked = false;
      var fnSuccess = options.success;
      options.success = bind(this, function(response, info) {
        if(info.network && this._shouldUpdateCache(options.policy)) {
          // Save locally in the background. This is only part of the complete
          // step.
          this.local.put(operation, arg, response, {
            success: function() { options.complete(); },
            error: function() { options.complete(); }
          });
        }

        // Determine whether application-level handler should be triggered.
        var secondPass = invoked;
        if(!invoked || this._shouldCallBothCallbacks(options.policy)) {
          invoked = true;
          fnSuccess(response, info);
        }

        // Trigger complete callback on final pass.
        if(secondPass || !this._shouldCallBothCallbacks(options.policy)) {
          options.complete();
        }
      });

      // Handle according to policy.
      primaryStore[operation](arg, {
        success: bind(this, function(response, info) {
          options.success(response, info);

          // Only call secondary store if the policy allows calling both.
          if(this._shouldCallBoth(options.policy)) {
            options.error = function() {// reset error, we already succeeded.
              options.complete();
            };
            secondaryStore[operation](arg, options);
          }
        }),
        error: bind(this, function(error, info) {
          // Switch to secondary store if the caching policy allows a fallback.
          if(this._shouldCallFallback(options.policy)) {
            var fnError = options.error;
            options.error = function(error, info) {
              fnError(error, info);
              options.complete();
            };
            secondaryStore[operation](arg, options);
          }
          else {// no fallback, error out here.
            options.error(error, info);
            options.complete();
          }
        })
      });
    },

    /**
     * Returns whether both the local and network store should be used.
     * 
     * @private
     * @param {integer} policy Cache policy.
     * @return {boolean}
     */
    _shouldCallBoth: function(policy) {
      var accepted = [Kinvey.Store.Sync.CACHE_FIRST, Kinvey.Store.Sync.BOTH];
      return -1 !== accepted.indexOf(policy);
    },

    /**
     * Returns whether both the local and network success handler should be invoked.
     * 
     * @private
     * @param {integer} policy Cache policy.
     * @return {boolean}
     */
    _shouldCallBothCallbacks: function(policy) {
      return Kinvey.Store.Sync.BOTH === policy;
    },

    /**
     * Returns whether another store should be tried on initial failure.
     * 
     * @private
     * @param {integer} policy Cache policy.
     * @return {boolean}
     */
    _shouldCallFallback: function(policy) {
      var accepted = [Kinvey.Store.Sync.NETWORK_FIRST];
      return this._shouldCallBoth(policy) || -1 !== accepted.indexOf(policy);
    },

    /**
     * Returns whether network store should be accessed first.
     * 
     * @private
     * @param {integer} policy Cache policy.
     * @return {boolean}
     */
    _shouldCallNetworkFirst: function(policy) {
      var accepted = [Kinvey.Store.Sync.NO_CACHE, Kinvey.Store.Sync.NETWORK_FIRST];
      return -1 !== accepted.indexOf(policy);
    },

    /**
     * Returns whether the local cache should be updated.
     * 
     * @private
     * @param {integer} policy Cache policy.
     * @return {boolean}
     */
    _shouldUpdateCache: function(policy) {
      var accepted = [Kinvey.Store.Sync.CACHE_FIRST, Kinvey.Store.Sync.NETWORK_FIRST, Kinvey.Store.Sync.BOTH];
      return -1 !== accepted.indexOf(policy);
    }
  }, {
    /** @lends Kinvey.Store.Sync */

    // Cache policies.
    /**
     * No Cache policy. Ignore cache and only use the network.
     * 
     * @constant
     */
    NO_CACHE: 'nocache',

    /**
     * Cache Only policy. Don't use the network.
     * 
     * @constant
     */
    CACHE_ONLY: 'cacheonly',

    /**
     * Cache First policy. Pull from cache if available, otherwise network.
     * 
     * @constant
     */
    CACHE_FIRST: 'cache',

    /**
     * Network first policy. Pull from network if available, otherwise cache.
     * 
     * @constant
     */
    NETWORK_FIRST: 'network',

    /**
     * Both policy. Pull the cache copy (if it exists), then pull from network.
     * 
     * @constant
     */
    BOTH: 'both'
  });

}());
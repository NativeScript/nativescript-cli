(function() {

  /**
   * Kinvey Store namespace. Home to all stores.
   * 
   * @namespace
   */
  Kinvey.Store = {
    /**
     * AppData store.
     * 
     * @constant
     */
    APPDATA: 'appdata',

    /**
     * Cached store.
     * 
     * @constant
     */
    CACHED: 'cached',

    /**
     * Offline store.
     * 
     * @constant
     */
    OFFLINE: 'offline',

    /**
     * Returns store.
     * 
     * @param {string} collection Collection name.
     * @param {string} name Store, or store name.
     * @param {Object} options Store options.
     * @return {Kinvey.Store.*} One of Kinvey.Store.*.
     */
    factory: function(name, collection, options) {
      // Create store by name.
      if(Kinvey.Store.CACHED === name) {
        return new Kinvey.Store.Cached(collection, options);
      }
      if(Kinvey.Store.OFFLINE === name) {
        return new Kinvey.Store.Offline(collection, options);
      }

      // By default, use the AppData store.
      return new Kinvey.Store.AppData(collection, options);
    }
  };

}());
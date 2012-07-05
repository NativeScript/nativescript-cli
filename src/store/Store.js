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
     * @param {Object|string} name Store, or store name.
     * @param {Object} options Store options.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid store instance.</li>
     *           <li>On trying to take the user collection offline.</li>
     *           </ul>
     * @return {Kinvey.Store.*} One of Kinvey.Store.*.
     */
    factory: function(collection, name, options) {
      // Name could be a store instance already. Do a simple check to see
      // whether collection name matches the target collection.
      if(name instanceof Object) {
        if(collection !== name.collection) {
          throw new Error('Store collection does not match targeted collection');
        }
        return name;
      }

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
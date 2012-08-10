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
     * Blob store.
     * 
     * @constant
     */
    BLOB: 'blob',

    /**
     * Returns store.
     * 
     * @param {string} collection Collection name.
     * @param {Object|string} name Store, or store name.
     * @param {Object} options Store options.
     * @throws {Error} On invalid store instance.
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
      if(Kinvey.Store.BLOB === name) {
        return new Kinvey.Store.Blob(collection, options);
      }

      // By default, use the AppData store.
      return new Kinvey.Store.AppData(collection, options);
    }
  };

}());
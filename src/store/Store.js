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
     * @param {string} name Store name.
     * @param {string} collection Collection name.
     * @param {Object} options Store options.
     * @return {Kinvey.Store.*} One of Kinvey.Store.*.
     */
    factory: function(name, collection, options) {
      // Create store by name.
      if(Kinvey.Store.BLOB === name) {
        return new Kinvey.Store.Blob(collection, options);
      }

      // By default, use the AppData store.
      return new Kinvey.Store.AppData(collection, options);
    }
  };

}());
(function() {

  /**
   * Kinvey Store namespace. Home to all stores.
   * 
   * @namespace
   */
  Kinvey.Store = {
    /**
     * Returns default store.
     * 
     * @param {string} collection
     * @return {Kinvey.Store.AppData} AppData store.
     */
    factory: function(collection) {
      return new Kinvey.Store.AppData(collection);
    }
  };

}());
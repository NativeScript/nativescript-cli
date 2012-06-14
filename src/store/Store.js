(function() {

  // Define the Kinvey.Store object.
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
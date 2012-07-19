(function() {

  /**
   * Kinvey Resource namespace definition.
   * 
   * @namespace
   */
  Kinvey.Resource = {
    /**
     * Destroys a file.
     * 
     * @param {string} name Filename.
     * @param {Object} [options] Options.
     */
    destroy: function(name, options) {
      Kinvey.Resource._store || (Kinvey.Resource._store = new Kinvey.Store.Blob());
      Kinvey.Resource._store.remove({ name: name }, options);
    },

    /**
     * Downloads a file, or returns the download URI.
     * 
     * @param {string} name Filename.
     * @param {Object} [options] Options.
     */
    download: function(name, options) {
      Kinvey.Resource._store || (Kinvey.Resource._store = new Kinvey.Store.Blob());
      Kinvey.Resource._store.query(name, options);
    },

    /**
     * Uploads a file.
     * 
     * @param {string} name Filename.
     * @param {string} data File data.
     * @param {Object} [options] Options.
     */
    upload: function(name, data, options) {
      Kinvey.Resource._store || (Kinvey.Resource._store = new Kinvey.Store.Blob());
      Kinvey.Resource._store.save({ name: name, data: data }, options);
    },

    /**
     * We only need one instance of the blob store.
     * 
     * @private
     */
    _store: null
  };

}());
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
      Kinvey.Resource._store || (Kinvey.Resource._store = Kinvey.Store.factory(Kinvey.Store.BLOB));
      Kinvey.Resource._store.remove({ name: name }, options);
    },

    /**
     * Downloads a file, or returns the download URI.
     * 
     * @param {string} name Filename.
     * @param {Object} [options] Options.
     */
    download: function(name, options) {
      Kinvey.Resource._store || (Kinvey.Resource._store = Kinvey.Store.factory(Kinvey.Store.BLOB));
      Kinvey.Resource._store.query(name, options);
    },

    /**
     * Uploads a file.
     * 
     * @param {Object} file File.
     * @param {Object} [options] Options.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid file.</li>
     *           <li>On invalid file name.</li>
     *           </ul>
     */
    upload: function(file, options) {
      // Validate file.
      if(null == file || null == file.name || null == file.data) {
        throw new Error('File should be an object containing name and data');
      }

      // Validate characters in file name.
      // This is required because XMLHttpRequest internally uses encodeURI. Percent-encoded
      // characters don't seem to play well with the underlying blob storage.
      // @link https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURI
      if(file.name !== encodeURI(file.name) || file.name.match(/\#|\?|\//)) {
        throw new Error('File name contains invalid characters');
      }

      // Upload.
      Kinvey.Resource._store || (Kinvey.Resource._store = Kinvey.Store.factory(Kinvey.Store.BLOB));
      Kinvey.Resource._store.save(file, options);
    },

    /**
     * We only need one instance of the blob store.
     * 
     * @private
     */
    _store: null
  };

}());
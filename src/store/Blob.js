(function() {

  // Define the Kinvey.Store.Blob class.
  Kinvey.Store.Blob = Base.extend({
    // Default options.
    options: {
      timeout: 10000,// Timeout in ms.

      success: function() { },
      error: function() { }
    },

    /**
     * Creates a new store.
     * 
     * @name Kinvey.Store.Blob
     * @constructor
     * @param {Object} [options] Options.
     */
    constructor: function(options) {
      options && this.configure(options);
    },

    /** @lends Kinvey.Store.Blob# */

    /**
     * Configures store.
     * 
     * @param {Object} options
     * @param {function(response, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     * @param {integer} [options.timeout] Request timeout (in milliseconds).
     */
    configure: function(options) {
      'undefined' !== typeof options.timeout && (this.options.timeout = options.timeout);
      options.success && (this.options.success = options.success);
      options.error && (this.options.error = options.error);
    },

    /**
     * Downloads a file.
     * 
     * @param {string} name Filename.
     * @param {Object} [options] Options.
     */
    query: function(name, options) {
      options = this._options(options);

      // Send request to obtain the download URL.
      var url = this._getUrl('download-loc', name);
      this._send('GET', url, null, merge(options, {
        success: function(response, info) {
          // Stop here if the user wants us to.
          if('undefined' !== typeof options.download && !options.download) {
            return options.success(response, info);
          }

          // Otherwise, download the file.
          this._xhr('GET', response.URI, null, merge(options, {
            success: function(response, info) {
              options.success({
                name: name,
                data: response
              }, info);
            },
            error: function(_, info) {
              options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'There was a problem downloading the file.',
                debug: ''
              }, info);
            }
          }));
        }
      }));
    },

    /**
     * Removes a file.
     * 
     * @param {Object} file File to be removed.
     * @param {Object} [options] Options.
     * @throws {Error} On invalid file.
     */
    remove: function(file, options) {
      // Validate file.
      if(null == file || null == file.name) {
        throw new Error('File should be an object containing name');
      }
      options = this._options(options);

      // Send request to obtain the delete URL.
      var url = this._getUrl('remove-loc', file.name);
      this._send('GET', url, null, merge(options, {
        success: bind(this, function(response, info) {
          // Delete the file.
          this._xhr('DELETE', response.URI, null, merge(options, {
            error: function(_, info) {
              options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'There was a problem deleting the file.',
                debug: ''
              }, info);
            }
          }));
        })
      }));
    },

    /**
     * Uploads a file.
     * 
     * @param {Object} file File to be uploaded.
     * @param {Object} [options] Options.
     * @throws {Error} On invalid file.
     */
    save: function(file, options) {
      // Validate file.
      if(null == file || null == file.name || null == file.data) {
        throw new Error('File should be an object containing name and data');
      }
      options = this._options(options);

      // Send request to obtain the upload URL.
      this._send('GET', this._getUrl('upload-loc', file.name), null, merge(options, {
        success: bind(this, function(response, info) {
          // Upload the file.
          this._xhr('PUT', response.URI, file.data, merge(options, {
            success: function(_, info) {
              options.success(file, info);
            },
            error: function(_, info) {
              options.error({
                error: Kinvey.Error.RESPONSE_PROBLEM,
                description: 'There was a problem uploading the file.',
                debug: ''
              }, info);
            }
          }));
        })
      }));
    },

    /**
     * Constructs URL.
     * 
     * @private
     * @param {string} type One of download-loc, upload-loc or remove-loc.
     * @param {string} filename Filename.
     * @return {string} URL.
     */
    _getUrl: function(type, filename) {
      return '/' + Kinvey.Store.Blob.BLOB_API + '/' + Kinvey.appKey + '/' + type + '/' + filename;
    },

    /**
     * Returns full options object.
     * 
     * @private
     * @param {Object} options Options.
     * @return {Object} Options.
     */
    _options: function(options) {
      options || (options = {});
      'undefined' !== typeof options.timeout || (options.timeout = this.options.timeout);
      options.success || (options.success = this.options.success);
      options.error || (options.error = this.options.error);
      return options;
    }
  }, {
    // Path constants.
    BLOB_API: 'blob'
  });

  // Apply mixin.
  Xhr.call(Kinvey.Store.Blob.prototype);

}());
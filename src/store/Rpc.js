(function() {

  // Define the Kinvey.Store.Rpc class.
  Kinvey.Store.Rpc = Base.extend({
    // Default options.
    options: {
      timeout: 10000,// Timeout in ms.

      success: function() { },
      error: function() { }
    },

    /**
     * Constructor
     * 
     * @name Kinvey.Store.Rpc
     * @constructor
     * @param {Object} [options] Options.
     */
    constructor: function(options) {
      options && this.configure(options);
    },

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
     * Resets password for a user.
     * 
     * @param {string} username User name.
     * @param {Object} [options] Options.
     */
    resetPassword: function(username, options) {
      // Force use of application credentials by adding appc option.
      var url = this._getUrl([username, 'user-password-reset-initiate']);
      this._send('POST', url, null, merge(options, { appc: true }));
    },

    /**
     * Constructs URL.
     * 
     * @private
     * @param {Array} parts URL parts.
     * @return {string} URL.
     */
    _getUrl: function(parts) {
      var url = '/rpc/' + Kinvey.appKey;

      // Add url parts.
      parts.forEach(function(part) {
        url += '/' + part;
      });

      // Android < 4.0 caches all requests aggressively. For now, work around
      // by adding a cache busting query string.
      return url + '?_=' + new Date().getTime();
    }
  });

  // Apply mixin.
  Xhr.call(Kinvey.Store.Rpc.prototype);

}());
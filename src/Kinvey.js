(function() {

  // Current user.
  var currentUser = null;

  /**
   * API version.
   * 
   * @constant
   */
  Kinvey.API_VERSION = 0;

  /**
   * SDK version.
   * 
   * @constant
   */
  Kinvey.SDK_VERSION = '<%= pkg.version %>';

  /**
   * Returns current user, or null if not set.
   * 
   * @return {Kinvey.User} Current user.
   */
  Kinvey.getCurrentUser = function() {
    return currentUser;
  };

  /**
   * Initializes library for use with Kinvey services.
   * 
   * @example <code>
   * Kinvey.init({
   *   appKey: 'your-app-key',
   *   appSecret: 'your-app-secret'
   * });
   * </code>
   * 
   * @param {Object} options Kinvey credentials. Object expects properties:
   *          "appKey", "appSecret".
   * @throws {Error}
   *           <ul>
   *           <li>On empty appKey,</li>
   *           <li>On empty appSecret.</li>
   *           </ul>
   */
  Kinvey.init = function(options) {
    if('undefined' === typeof options.appKey || null == options.appKey) {
      throw new Error('appKey must be defined');
    }
    if('undefined' === typeof options.appSecret || null == options.appSecret) {
      throw new Error('appSecret must be defined');
    }

    // Store credentials.
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret;
  };

  /**
   * Round trips a request to the server and back, helps ensure connectivity.
   * 
   * @example <code>
   * Kinvey.ping({
   *   success: function(response) {
   *     console.log('Ping successful', response.kinvey, response.version);
   *   },
   *   error: function(error) {
   *     console.log('Ping failed', error.error);
   *   }
   * });
   * </code>
   * 
   * @param {Object} [options]
   * @param {function(response)} [options.success] Success callback.
   * @param {function(error)} [options.error] Failure callback.
   */
  Kinvey.ping = function(options) {
    Kinvey.Net.factory(Kinvey.Net.APPDATA_API, '').send(options);
  };

  /**
   * Sets the current user. This method is only used by the Kinvey.User
   * namespace.
   * 
   * @private
   * @param {Kinvey.User} user Current user.
   */
  Kinvey.setCurrentUser = function(user) {
    currentUser = user;
  };

}());
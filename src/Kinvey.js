(function() {

  // Current user.
  var currentUser = null;

  /**
   * API version.
   * 
   * @constant
   */
  Kinvey.API_VERSION = 1;

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
   * Initializes library for use with Kinvey services. Never use the master
   * secret in client-side code.
   * 
   * @example <code>
   * Kinvey.init({
   *   appKey: 'your-app-key',
   *   appSecret: 'your-app-secret'
   * });
   * </code>
   * 
   * @param {Object} options Kinvey credentials. Object expects properties:
   *          "appKey", and "appSecret" or "masterSecret".
   * @throws {Error}
   *           <ul>
   *           <li>On empty appKey,</li>
   *           <li>On empty appSecret and masterSecret.</li>
   *           </ul>
   */
  Kinvey.init = function(options) {
    options || (options = {});
    if(null == options.appKey) {
      throw new Error('appKey must be defined');
    }
    if(null == options.appSecret && null == options.masterSecret) {
      throw new Error('appSecret or masterSecret must be defined');
    }

    // Store credentials.
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret || null;
    Kinvey.masterSecret = options.masterSecret || null;

    // Restore current user.
    Kinvey.User._restore();
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
   *     console.log('Ping failed', error.message);
   *   }
   * });
   * </code>
   * 
   * @param {Object} [options]
   * @param {function(response, info)} [options.success] Success callback.
   * @param {function(error, info)} [options.error] Failure callback.
   */
  Kinvey.ping = function(options) {
    // Ping always targets the Kinvey backend.
    new Kinvey.Store.AppData(null).query(null, options);
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
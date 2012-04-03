(function(Kinvey) {

  // Active user
  var currentUser;

  /**
   * API version
   * 
   * @constant
   */
  Kinvey.API_VERSION = 0;

  /**
   * SDK version
   * 
   * @constant
   */
  Kinvey.SDK_VERSION = '0.1.0dev';

  /**
   * Returns current user, or null if not set
   * 
   * @return {Kinvey.User} current user
   */
  Kinvey.getCurrentUser = function() {
    return currentUser;
  };

  /**
   * Initializes library for use with Kinvey services
   * 
   * @example <code>
   * Kinvey.init({
   *   appKey: '<your-app-key>',
   *   appSecret: '<your-app-secret>'
   * });
   * </code>
   * 
   * @param {Object} options
   * @throws {Error} on empty appKey, empty appSecret
   */
  Kinvey.init = function(options) {
    if('undefined' === typeof options.appKey || null == options.appKey) {
      throw new Error('appKey must be defined');
    }
    if('undefined' === typeof options.appSecret || null == options.appSecret) {
      throw new Error('appSecret must be defined');
    }

    // Store credentials
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret;
  };

  /**
   * Round trips a request to the server and back, helps ensure connectivity
   * 
   * @example <code>
   * Kinvey.ping(function(response) {
   *   console.log('Ping successful', response);
   * }, function(error) {
   *   console.log('Ping failed', error);
   * });
   * </code>
   * 
   * @param {function(Object)} [success] success callback
   * @param {function(Object)} [failure] failure callback
   */
  Kinvey.ping = function(success, failure) {
    var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, '');
    net.send(Kinvey.Net.READ, success, failure);
  };

  /**
   * Sets current user
   * 
   * @param {Kinvey.User} user user instance
   */
  Kinvey.setCurrentUser = function(user) {
    currentUser = user;
  };

}(Kinvey));
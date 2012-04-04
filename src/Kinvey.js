(function(Kinvey) {

  // Active user
  var currentUser;

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
  Kinvey.SDK_VERSION = '0.1.0dev';

  /**
   * Returns current user, or null if not set.
   * 
   * @return {Kinvey.User} Current user.
   */
  Kinvey.getCurrentUser = function() {
    return currentUser || null;
  };

  /**
   * Initializes library for use with Kinvey services.
   * 
   * @example <code>
   * Kinvey.init({
   *   appKey: '<your-app-key>',
   *   appSecret: '<your-app-secret>'
   * });
   * </code>
   * 
   * @param {Object} options Kinvey credentials. Object expects properties:
   *          "appKey", "appSecret".
   * @throws {Error} On empty appKey, empty appSecret.
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
   * Round trips a request to the server and back, helps ensure connectivity.
   * 
   * @example <code>
   * Kinvey.ping(function() {
   *   console.log('Ping successful', this.kinvey, this.version);
   * }, function(error) {
   *   console.log('Ping failed', error);
   * });
   * </code>
   * 
   * @param {function()} [success] Success callback. {this} is a response object
   *          with properties: "kinvey", "version".
   * @param {function(Object)} [failure] Failure callback, {this} is an empty
   *          object. Only argument is an error object.
   */
  Kinvey.ping = function(success, failure) {
    var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, '');
    net.send(Kinvey.Net.READ, function(response) {
      bind(response, success)();
    }, bind({}, failure));
  };

  /**
   * Sets current user.
   * 
   * @param {Kinvey.User} user User instance.
   */
  Kinvey.setCurrentUser = function(user) {
    currentUser = user;
  };

}(Kinvey));
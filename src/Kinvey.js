(function() {

  // Device user
  var deviceUser = null;

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
   * Returns device user, or null if not set.
   * 
   * @return {Kinvey.User} Device user.
   */
  Kinvey.getDeviceUser = function() {
    return deviceUser;
  };

  /**
   * Initializes library for use with Kinvey services.
   * 
   * @example <code>
   * Kinvey.init({
   *   appKey: '<your-app-key>',
   *   appSecret: '<your-app-secret>',
   *   env: 'node'
   * });
   * </code>
   * 
   * @param {Object} options Kinvey credentials. Object expects properties:
   *          "appKey", "appSecret". Optional properties: "env".
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

    // Store credentials
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret;
    Kinvey.env = options.env || 'HTML5';
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
    net.send(function(response) {
      bind(response, success)();
    }, bind({}, failure));
  };

}());
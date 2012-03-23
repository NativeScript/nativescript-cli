(function(Kinvey) {

  /**
   * Creates a new user
   * 
   * @example
   * 
   * <pre>
   * var user = new Kinvey.User();
   * var user = new Kinvey.User({
   *   property: 'value'
   * });
   * </pre>
   * 
   * @extends Kinvey.Entity
   * @constructor
   * @param {Object} [map] entity data
   */
  Kinvey.User = function(map) {
    // Call parent constructor, pass empty collection name.
    Kinvey.User._super.constructor.call(this, '', map);

    // Constants
    /**
     * @override
     * @private
     * @constant
     */
    this.API = Kinvey.Net.USER_API;

    // Key constants
    this.KEY_SECRET = 'password';
    this.KEY_USERNAME = 'username';

    // Properties
    /**
     * Flag whether user is current device user.
     * 
     * @private
     * @type boolean
     */
    this.isDeviceUser = false;
  };
  inherits(Kinvey.User, Kinvey.Entity);

  // Methods
  extend(Kinvey.User.prototype, {
    /** @lends Kinvey.User# */

    /**
     * Returns user secret or null if not set
     * 
     * @return {string} user secret
     */
    getSecret: function() {
      return this.getValue(this.KEY_SECRET);
    },

    /**
     * Returns username or null if not set
     * 
     * @return {string} username
     */
    getUsername: function() {
      return this.getValue(this.KEY_USERNAME);
    },

    /**
     * Stores user as current user and links to device.
     * 
     * <ol>
     * <li>reads user from disk</li>
     * <li>creates user and save to disk</li>
     * <li>creates anonymous user and save to disk</li>
     * </ol>
     * 
     * @param {function()} [success] success callback
     * @param {function([Object])} [failure] failure callback
     * @throws {Error} on conflicting invocation, or when user is not the device
     *           user, or when secret cannot be retrieved
     */
    initCurrentUser: function(success, failure) {
      // FIXME complete, also consider login + logout, ability to reset
      // currentuser
      // Since method is asynchronous, block on conflicting invocation
      if(isInitializing) {
        throw new Error('User is currently being initialized');
      }

      // Only init when current user is not set
      if(null != currentUser) {
        throw new Error('Current user already set');
      }

      // Set current user
      this.isDeviceUser = true;
      if(window.localStorage && window.localStorage['knvy.user']) {
        this.map = window.JSON.parse(window.localStorage['knvy.user']);
        currentUser = this;
        success && success();
      }
      else {// create anonymous user (asynchronous)
        var that = this;// context
        isInitializing = true;// flip flag
        this.save(function() {
          // Save to disk
          window.localStorage['knvy.user'] = window.JSON.stringify(that.map);

          // Done
          currentUser = that;
          isInitializing = false;// reset flag
          success && success();
        }, function(error) {
          isInitializing = false;// reset flag
          failure && failure(error);
        });
      }
    },

    /**
     * @override
     * @see Kinvey.Entity#remove
     */
    remove: function(success, failure) {
      if(!this.isDeviceUser) {
        failure && failure({
          error: 'Not authorized to remove user'
        });
        return;
      }
      Kinvey.User._super.remove.call(this, success, failure);
    },

    /**
     * @override
     * @see Kinvey.Entity#save
     */
    save: function(success, failure) {
      if(!this.isDeviceUser) {
        failure && failure({
          error: 'Not authorized to save user'
        });
        return;
      }
      Kinvey.User._super.save.call(this, success, failure);
    },

    /**
     * Sets username
     * 
     * @param {string} username username
     * @throws {Error} on empty username
     */
    setUsername: function(username) {
      if(null == username) {
        throw new Error('Username must not be null');
      }
      this.setValue(this.KEY_USERNAME, username);
    },

    /**
     * Sets secret
     * 
     * @param {string} secret user secret
     * @throws {Error} on empty secret
     */
    setSecret: function(secret) {
      if(null == secret) {
        throw new Error('Secret must not be null');
      }
      this.setValue(this.KEY_SECRET, secret);
    }
  });

  /**
   * User initializing status flag
   * 
   * @private
   * @type boolean
   */
  var isInitializing = false;

}(Kinvey));
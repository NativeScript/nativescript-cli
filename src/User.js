(function(Kinvey) {

  /**
   * Creates a new user.
   * 
   * @example <code>
   * var user = new Kinvey.User();
   * var user = new Kinvey.User({
   *   property: 'value'
   * });
   * </code>
   * 
   * @extends Kinvey.Entity
   * @constructor
   * @param {Object} [prop] Entity data.
   */
  Kinvey.User = function(prop) {
    // Call parent constructor, pass empty collection name.
    Kinvey.User._super.constructor.call(this, '', prop);

    // Constants
    /**
     * @override
     * @private
     * @constant
     */
    this.API = Kinvey.Net.USER_API;

    // Key constants
    this.KEY_USERNAME = 'username';
    this.KEY_PASSWORD = 'password';

    // Properties
    /**
     * Flag whether user is logged in.
     * 
     * @type boolean
     */
    this.isLoggedIn = false;
  };
  inherits(Kinvey.User, Kinvey.Entity);

  // Methods
  extend(Kinvey.User.prototype, {
    /** @lends Kinvey.User# */

    /**
     * Destroys user.
     * 
     * @override
     * @throws {Error} Always.
     */
    destroy: function() {
      throw new Error('Cannot delete a user');
    },

    /**
     * Returns password or null if not set.
     * 
     * @return {string} Password.
     */
    getPassword: function() {
      return this.get(this.KEY_PASSWORD);
    },

    /**
     * Returns username or null if not set.
     * 
     * @return {string} Username.
     */
    getUsername: function() {
      return this.get(this.KEY_USERNAME);
    },

    /**
     * Logs in user.
     * 
     * @param {function(Kinvey.User)} [success] success callback
     * @param {function(Object)} [failure] failure callback
     */
    login: function(success, failure) {
      // Make sure only one user is active at the time
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout();
      }
      Kinvey.setCurrentUser(this);

      // Retrieve user
      var password = this.getPassword();
      this.findBy({
        username: this.getUsername(),
        password: password
      }, function() {
        this.isLoggedIn = true;
        this.setPassword(password);//keep password from getting overwritten

        bind(this, success)();
      }, function(error) {//failed, reset
        Kinvey.setCurrentUser(null);
        bind(this, failure)(error);
      });
    },

    /**
     * Logs out user.
     * 
     * @return {boolean} Success.
     */
    logout: function() {
      // !null === true
      return this.isLoggedIn && !Kinvey.setCurrentUser(null);
    },

    /**
     * Registers new user.
     * 
     * @param {function(Kinvey.User)} [success] success callback
     * @param {function(Object)} [failure] failure callback
     */
    register: function(success, failure) {
      // TODO
    },

    // /**
    // * Stores user as current user and links to device.
    // *
    // * <ol>
    // * <li>reads user from disk</li>
    // * <li>creates user and save to disk</li>
    // * <li>creates anonymous user and save to disk</li>
    // * </ol>
    // *
    // * @param {function()} [success] success callback
    // * @param {function([Object])} [failure] failure callback
    // * @throws {Error} on conflicting invocation, or when user is not the
    // device
    // * user, or when secret cannot be retrieved
    // */
    // initCurrentUser: function(success, failure) {
    // // FIXME complete, also consider login + logout, ability to reset
    // // currentuser
    // // Since method is asynchronous, block on conflicting invocation
    // if(isInitializing) {
    // throw new Error('User is currently being initialized');
    // }
    //
    // // Only init when current user is not set
    // if(null != currentUser) {
    // throw new Error('Current user already set');
    // }
    //
    // // Set current user
    // this.isDeviceUser = true;
    // if(window.localStorage && window.localStorage['knvy.user']) {
    // this.map = window.JSON.parse(window.localStorage['knvy.user']);
    // currentUser = this;
    // success && success();
    // }
    // else {// create anonymous user (asynchronous)
    // var that = this;// context
    // isInitializing = true;// flip flag
    // this.save(function() {
    // // Save to disk
    // window.localStorage['knvy.user'] = window.JSON.stringify(that.map);
    //
    // // Done
    // currentUser = that;
    // isInitializing = false;// reset flag
    // success && success();
    // }, function(error) {
    // isInitializing = false;// reset flag
    // failure && failure(error);
    // });
    // }
    // },

    // /**
    // * @override
    // * @see Kinvey.Entity#remove
    // */
    // remove: function(success, failure) {
    // if(!this.isDeviceUser) {
    // failure && failure({
    // error: 'Not authorized to remove user'
    // });
    // return;
    // }
    // Kinvey.User._super.remove.call(this, success, failure);
    // },
    //
    // /**
    // * @override
    // * @see Kinvey.Entity#save
    // */
    // save: function(success, failure) {
    // if(!this.isDeviceUser) {
    // failure && failure({
    // error: 'Not authorized to save user'
    // });
    // return;
    // }
    // Kinvey.User._super.save.call(this, success, failure);
    // },

    /**
     * Sets password.
     * 
     * @param {string} password Password.
     * @throws {Error} On empty password.
     */
    setPassword: function(password) {
      if(null == password) {
        throw new Error('Password must not be null');
      }
      this.set(this.KEY_PASSWORD, password);
    },

    /**
     * Sets username.
     * 
     * @param {string} username Username.
     * @throws {Error} On empty username.
     */
    setUsername: function(username) {
      if(null == username) {
        throw new Error('Username must not be null');
      }
      this.set(this.KEY_USERNAME, username);
    }
  });

  //  /**
  //   * User initializing status flag
  //   *
  //   * @private
  //   * @type boolean
  //   */
  //  var isInitializing = false;

}(Kinvey));
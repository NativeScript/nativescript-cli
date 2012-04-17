(function() {

  /*globals localStorage*/

  // Define the Kinvey User class.
  Kinvey.User = Kinvey.Entity.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.USER_API,

    // Credential attribute keys.
    ATTR_USERNAME: 'username',
    ATTR_PASSWORD: 'password',

    /**
     * Creates a new user.
     * 
     * @example <code>
     * var user = new Kinvey.User();
     * var user = new Kinvey.User({
     *   key: 'value'
     * });
     * </code>
     * 
     * @name Kinvey.User
     * @constructor
     * @extends Kinvey.Entity
     * @param {Object} [attr] Attributes.
     */
    constructor: function(attr) {
      // Users reside in a distinct API, without the notion of collections.
      // Therefore, an empty string is passed to the parent constructor.
      Kinvey.Entity.prototype.constructor.call(this, '', attr);
    },

    /** @lends Kinvey.User# */

    /**
     * Destroys user. Use with caution.
     * 
     * @override
     * @see Kinvey.Entity#destroy
     */
    destroy: function(success, failure) {
      if(!this.isLoggedIn) {
        bind(this, failure)({
          error: 'This request requires the master secret'
        });
        return;
      }

      // User is logged in, so it can remove itself.
      Kinvey.Entity.prototype.destroy.call(this, function() {
        this.logout();
        bind(this, success)();
      }, bind(this, failure));
    },

    /**
     * Returns password or null if not set.
     * 
     * @return {string} Password.
     */
    getPassword: function() {
      return this.get(this.ATTR_PASSWORD);
    },

    /**
     * Returns username or null if not set.
     * 
     * @return {string} Username.
     */
    getUsername: function() {
      return this.get(this.ATTR_USERNAME);
    },

    /**
     * Logs in user.
     * 
     * @param {string} username Username.
     * @param {string} password Password.
     * @param {function()} [success] Success callback. {this} is the User
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the User
     *          instance. Only argument is an error object.
     */
    login: function(username, password, success, failure) {
      // Make sure only one user is active at the time.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout();
      }

      // Retrieve user.
      this.setUsername(username);
      this.setPassword(password);

      // Send request.
      var net = Kinvey.Net.factory(this.API, this.collection, 'login');
      net.setData(this.attr);
      net.setOperation(Kinvey.Net.CREATE);
      net.send(bind(this, function(response) {
        // Update attributes. Preserve password since it is needed as part of
        // the authorization.
        this.attr = response;
        this.setPassword(password);
        this._login();
        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Logs out user.
     * 
     */
    logout: function() {
      if(this.isLoggedIn) {
        Kinvey.setCurrentUser(null);
        this._deleteFromDisk();
        this.isLoggedIn = false;
      }
    },

    /**
     * Saves a user.
     * 
     * @override
     * @see Kinvey.Entity#save
     */
    save: function(success, failure) {
      if(!this.isLoggedIn) {
        bind(this, failure)({
          error: 'This request requires the master secret'
        });
        return;
      }

      // Parent method will always update. Response does not include the
      // password, so persist it manually.
      var password = this.getPassword();
      Kinvey.Entity.prototype.save.call(this, function() {
        this.setPassword(password);
        this._login();
        bind(this, success)();
      }, failure);
    },

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
      this.set(this.ATTR_PASSWORD, password);
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
      this.set(this.ATTR_USERNAME, username);
    },

    /**
     * @private
     */
    _deleteFromDisk: function() {
      localStorage.removeItem(Kinvey.User.CACHE_TAG);
    },

    /**
     * @private
     */
    _login: function() {
      Kinvey.setCurrentUser(this);
      this._saveToDisk();
      this.isLoggedIn = true;
    },

    /**
     * @private
     */
    _saveToDisk: function() {
      localStorage.setItem(Kinvey.User.CACHE_TAG, JSON.stringify(this));
    }
  }, {
    /** @lends Kinvey.User */

    // Cache tag.
    CACHE_TAG: 'Kinvey.currentUser',

    /**
     * Creates the current user.
     * 
     * @param {string} [username] Username.
     * @param {string} [password] Password.
     * @param {function()} [success] Success callback. {this} is the User
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the User
     *          instance. Only argument is an error object.
     * @return {Kinvey.User} The user instance (not necessarily persisted yet).
     */
    create: function(username, password, success, failure) {
      // Parse arguments.
      if(null == username || 'function' === typeof username) {
        // Auto-generate credentials.
        success = username;
        failure = password;
        username = password = '';
      }
      else if(null == password || 'function' === typeof password) {
        // Only auto-generate password.
        failure = success;
        success = password;
        password = '';
      }

      // Make sure only one user is active at the time.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout();
      }

      // Instantiate a user object.
      var user = new Kinvey.User();
      user.setUsername(username);
      user.setPassword(password);

      // Persist, and implicitly mark the created user as logged in.
      Kinvey.Entity.prototype.save.call(user, function() {
        this._login();
        bind(this, success)();
      }, failure);

      // Return the instance.
      return user;
    },

    /**
     * Initializes the current user. Restores the user from cache, or creates an
     * anonymous user if not set. This method should only be called internally.
     * 
     * @param {function()} [success] Success callback. {this} is the current
     *          user instance.
     * @param {function()} [failure] Failure callback. {this} is a user
     *          instance. Only argument is an error object.
     * @return {Kinvey.User} The user instance. (not necessarily persisted yet).
     */
    init: function(success, failure) {
      // First, check whether there already is a current user.
      var user = Kinvey.getCurrentUser();
      if(null !== user) {
        bind(user, success)();
        return user;
      }

      // Second, check if user attributes are stored locally on the device.
      var attr = JSON.parse(localStorage.getItem(Kinvey.User.CACHE_TAG));
      if(null !== attr && null != attr.username && null != attr.password) {
        // Re-authenticate user to ensure it is not stale.
        user = new Kinvey.User();
        user.login(attr.username, attr.password, success, failure);
        return user;
      }

      // No cached user available either, create anonymous user.
      return Kinvey.User.create(success, failure);
    }
  });

}());
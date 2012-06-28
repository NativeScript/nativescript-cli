(function() {

  // Function to get the cache key for this app.
  var CACHE_TAG = function() {
    return 'Kinvey.' + Kinvey.appKey;
  };

  // Define the Kinvey User class.
  Kinvey.User = Kinvey.Entity.extend({
    // Credential attributes.
    ATTR_USERNAME: 'username',
    ATTR_PASSWORD: 'password',

    /**
     * Creates a new user.
     * 
     * @example <code>
     * var user = new Kinvey.User();
     * var user = new Kinvey.User({ key: 'value' });
     * </code>
     * 
     * @name Kinvey.User
     * @constructor
     * @extends Kinvey.Entity
     * @param {Object} [attr] Attributes.
     */
    constructor: function(attr) {
      Kinvey.Entity.prototype.constructor.call(this, attr, 'user');
    },

    /** @lends Kinvey.User# */

    /**
     * Destroys user. Use with caution.
     * 
     * @override
     * @see Kinvey.Entity#destroy
     */
    destroy: function(options) {
      Kinvey.Entity.prototype.destroy.call(this, {
        success: function(user, info) {
          user.logout();
          options.success(user, info);
        },
        error: options.error
      });
    },

    /**
     * Returns password, or null if not set.
     * 
     * @return {string} Password.
     */
    getPassword: function() {
      return this.get(this.ATTR_PASSWORD);
    },

    /**
     * Returns username, or null if not set.
     * 
     * @return {string} Username.
     */
    getUsername: function() {
      return this.get(this.ATTR_USERNAME);
    },

    /**
     * Logs in user.
     * 
     * @example <code> 
     * var user = new Kinvey.User();
     * user.login('username', 'password', {
     *   success: function() {
     *     console.log('Login successful');
     *   },
     *   error: function(error) {
     *     console.log('Login failed', error);
     *   }
     * });
     * </code>
     * 
     * @param {string} username Username.
     * @param {string} password Password.
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(entity, error, info)} [options.error] Failure callback.
     */
    login: function(username, password, options) {
      options || (options = {});

      // Make sure only one user is active at the time.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout();
      }

      // Retrieve user.
      this.setUsername(username);
      this.setPassword(password);

      // Send request.
      this.store.login(this, {
        success: bind(this, function(response, info) {
          // Update attributes. Preserve password since it is part of
          // the authorization.
          this.attr = response;
          this.setPassword(password);
          this._login();
          options.success && options.success(this, info);
        }),
        error: bind(this, function(error, info) {
          options.error && options.error(this, error, info);
        })
      });
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
    save: function(options) {
      options || (options = {});
      if(!this.isLoggedIn) {
        options.error && options.error({
          code: Kinvey.Error.OPERATION_DENIED,
          description: 'This operation is not allowed',
          debug: 'Cannot save a user which is not logged in.'
        }, {});
        return;
      }

      // Parent method will always update. Response does not include the
      // password, so persist it manually.
      var password = this.getPassword();
      Kinvey.Entity.prototype.save.call(this, {
        success: function(user, info) {
          user.setPassword(password);
          user._login();
          options.success && options.success(user, info);
        },
        error: options.error
      });
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
     * Removes any user saved on disk.
     * 
     * @private
     */
    _deleteFromDisk: function() {
      Storage.remove(CACHE_TAG());
    },

    /**
     * Marks user as logged in. This method should never be called standalone,
     * but always involve some network request.
     * 
     * @private
     */
    _login: function() {
      Kinvey.setCurrentUser(this);
      this._saveToDisk();
      this.isLoggedIn = true;
    },

    /**
     * Saves current user to disk.
     * 
     * @private
     */
    _saveToDisk: function() {
      Storage.set(CACHE_TAG(), this);
    }
  }, {
    /** @lends Kinvey.User */

    /**
     * Creates the current user.
     * 
     * @example <code>
     * Kinvey.User.create({
     *   username: 'username'
     * }, {
     *   success: function(user) {
     *     console.log('User created', user);
     *   },
     *   error: function(error) {
     *     console.log('User not created', error.message);
     *   }
     * });
     * </code>
     * 
     * @param {Object} attr Attributes.
     * @param {Object} [options]
     * @param {function(user)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     * @return {Kinvey.User} The user instance (not necessarily persisted yet).
     */
    create: function(attr, options) {
      options || (options = {});

      // Make sure only one user is active at the time.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout();
      }

      // Persist, and mark the created user as logged in.
      var user = new Kinvey.User(attr);
      Kinvey.Entity.prototype.save.call(user, {
        success: function(user, info) {
          user._login();
          options.success && options.success(user, info);
        },
        error: options.error
      });
      return user;// return the instance
    },

    /**
     * Initializes a current user. Returns the current user, otherwise creates
     * an anonymous user. This method is called internally when doing a network
     * request. Manually invoking this function is however allowed.
     * 
     * @param {Object} [options]
     * @param {function(user)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     * @return {Kinvey.User} The user instance. (not necessarily persisted yet).
     */
    init: function(options) {
      options || (options = {});

      // Check whether there already is a current user.
      var user = Kinvey.getCurrentUser();
      if(null !== user) {
        options.success && options.success(user, {});
        return user;
      }

      // No cached user available, create anonymous user.
      return Kinvey.User.create({}, options);
    },

    /**
     * Restores user stored locally on the device. This method is called by
     * Kinvey.init(), and should not be called anywhere else.
     * 
     * @private
     */
    _restore: function() {
      // Return if there already is a current user. Safety check.
      if(null !== Kinvey.getCurrentUser()) {
        return;
      }

      // Retrieve and restore user from storage.
      var attr = Storage.get(CACHE_TAG());
      if(null !== attr && null != attr.username && null != attr.password) {
        new Kinvey.User(attr)._login();
      }
    }
  });

}());
(function() {

  // Function to get the cache key for this app.
  var CACHE_TAG = function() {
    return 'Kinvey.' + Kinvey.appKey;
  };

  // Define the Kinvey User class.
  Kinvey.User = Kinvey.Entity.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.USER_API,

    // Credential attributes.
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
    destroy: function(options) {
      options || (options = {});
      if(!this.isLoggedIn) {
        options.error && options.error({
          error: 'This request requires the master secret'
        });
        return;
      }

      // Users are allowed to remove themselves.
      Kinvey.Entity.prototype.destroy.call(this, {
        success: bind(this, function() {
          this.logout();
          options.success && options.success();
        }),
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
     * @param {function(entity)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
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
      var net = Kinvey.Net.factory(this.API, this.collection, 'login');
      net.setData(this.attr);
      net.setOperation(Kinvey.Net.CREATE);
      net.send({
        success: bind(this, function(response) {
          // Update attributes. Preserve password since it is part of
          // the authorization.
          this.attr = response;
          this.setPassword(password);
          this._login();
          options.success && options.success(this);
        }),
        error: options.error
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
          error: 'This request requires the master secret'
        });
        return;
      }

      // Parent method will always update. Response does not include the
      // password, so persist it manually.
      var password = this.getPassword();
      Kinvey.Entity.prototype.save.call(this, {
        success: bind(this, function() {
          this.setPassword(password);
          this._login();
          options.success && options.success(this);
        }),
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
     * Kinvey.create({
     *   username: 'username'
     * }, {
     *   success: function(user) {
     *     console.log('User created', user);
     *   },
     *   error: function(error) {
     *     console.log('User not created', error.error);
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
        success: bind(user, function() {
          this._login();
          options.success && options.success(this);
        }),
        error: options.error
      });
      return user;// return the instance
    },

    /**
     * Initializes a current user. Restores the user from cache, or creates an
     * anonymous user. This method is called internally when doing a network
     * request. Manually invoking this function is however allowed.
     * 
     * @param {Object} [options]
     * @param {function(user)} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     * @return {Kinvey.User} The user instance. (not necessarily persisted yet).
     */
    init: function(options) {
      options || (options = {});

      // First, check whether there already is a current user.
      var user = Kinvey.getCurrentUser();
      if(null !== user) {
        options.success && options.success(user);
        return user;
      }

      // Second, check if user attributes are stored locally on the device.
      var attr = Storage.get(CACHE_TAG());
      if(null !== attr && null != attr.username && null != attr.password) {
        // Extend the error callback, so local data can be destroyed if stale.
        var original = options.error;
        options.error = function(error) {
          Storage.remove(CACHE_TAG());
          original && original(error);
        };

        // Re-authenticate user to ensure it is not stale.
        user = new Kinvey.User();
        user.login(attr.username, attr.password, options);
        return user;
      }

      // No cached user available either, create anonymous user.
      return Kinvey.User.create({}, options);
    }
  });

}());
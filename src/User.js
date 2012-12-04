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

    // Authorization token.
    token: null,

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
      options || (options = {});

      // Destroying the user will automatically invalidate its token, so no
      // need to logout explicitly.
      Kinvey.Entity.prototype.destroy.call(this, merge(options, {
        success: bind(this, function(_, info) {
          this._logout();
          options.success && options.success(this, info);
        })
      }));
    },

    /**
     * Returns social identity, or null if not set.
     * 
     * @return {Object} Identity.
     */
    getIdentity: function() {
      return this.get('_socialIdentity');
    },

    /**
     * Returns token, or null if not set.
     * 
     * @return {string} Token.
     */
    getToken: function() {
      return this.token;
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
     * @param {function(error, info)} [options.error] Failure callback.
     */
    login: function(username, password, options) {
      this._doLogin({
        username: username,
        password: password
      }, options || {});
    },

    /**
     * Logs in user given a Facebook oAuth token.
     * 
     * @param {string} token oAuth token.
     * @param {Object} [attr] User attributes.
     * @param {Object} [options]
     * @param {function(entity, info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    loginWithFacebook: function(token, attr, options) {
      attr || (attr = {});
      attr._socialIdentity = { facebook: { access_token: token } };
      options || (options = {});

      // Login, or create when there is no user with this Facebook identity.
      this._doLogin(attr, merge(options, {
        error: bind(this, function(error, info) {
          // If user could not be found, register.
          if(Kinvey.Error.USER_NOT_FOUND === error.error) {
            // Pass current instance as (private) option to create.
            this.attr = attr;// Required as we set a specific target below.
            return Kinvey.User.create(attr, merge(options, {
              _target: this
            }));
          }

          // Something else went wrong (invalid token?), error out.
          options.error && options.error(error, info);
        })
      }));
    },

    /**
     * Logs out user.
     * 
     * @param {Object} [options] Options.
     * @param {function(info)} [options.success] Success callback.
     * @param {function(error, info)} [options.error] Failure callback.
     */
    logout: function(options) {
      options || (options = {});

      // Make sure we only logout the current user.
      if(!this.isLoggedIn) {
        options.success && options.success({});
        return;
      }
      this.store.logout({}, merge(options, {
        success: bind(this, function(_, info) {
          this._logout();
          options.success && options.success(info);
        })
      }));
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
          code: Kinvey.Error.BAD_REQUEST,
          description: 'This operation is not allowed',
          debug: 'Cannot save a user which is not logged in.'
        }, {});
        return;
      }

      // Parent method will always update.
      Kinvey.Entity.prototype.save.call(this, merge(options, {
        success: bind(this, function(_, info) {
          this._saveToDisk();// Refresh cache.
          options.success && options.success(this, info);
        })
      }));
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
     * Performs login.
     * 
     * @private
     * @param {Object} attr Attributes.
     * @param {Object} options Options.
     */
    _doLogin: function(attr, options) {
      // Make sure only one user is active at the time.
      var currentUser = Kinvey.getCurrentUser();
      if(null !== currentUser) {
        currentUser.logout(merge(options, {
          success: bind(this, function() {
            this._doLogin(attr, options);
          })
        }));
        return;
      }

      // Send request.
      this.store.login(attr, merge(options, {
        success: bind(this, function(response, info) {
          // Extract token.
          var token = response._kmd.authtoken;
          delete response._kmd.authtoken;

          // Update attributes. This does not include the users password.
          this.attr = this._parseAttr(response);
          this._login(token);

          options.success && options.success(this, info);
        })
      }));
    },

    /**
     * Marks user as logged in. This method should never be called standalone,
     * but always involve some network request.
     * 
     * @private
     * @param {string} token Token.
     */
    _login: function(token) {
      // The master secret does not need a current user.
      if(null == Kinvey.masterSecret) {
        Kinvey.setCurrentUser(this);
        this.isLoggedIn = true;
        this.token = token;
        this._saveToDisk();
      }
    },

    /**
     * Marks user no longer as logged in.
     * 
     * @private
     */
    _logout: function() {
      // The master secret does not need a current user.
      if(null == Kinvey.masterSecret) {
        Kinvey.setCurrentUser(null);
        this.isLoggedIn = false;
        this.token = null;
        this._deleteFromDisk();
      }
    },

    /**
     * Saves current user to disk.
     * 
     * @private
     */
    _saveToDisk: function() {
      Storage.set(CACHE_TAG(), {
        token: this.token,
        user: this.toJSON()
      });
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
        currentUser.logout(merge(options, {
          success: function() {
            Kinvey.User.create(attr, options);
          }
        }));
        return;
      }

      // Create a new user.
      var user = options._target || new Kinvey.User(attr);
      Kinvey.Entity.prototype.save.call(user, merge(options, {
        success: bind(user, function(_, info) {
          // Extract token.
          var token = this.attr._kmd.authtoken;
          delete this.attr._kmd.authtoken;
          this._login(token);

          options.success && options.success(this, info);
        })
      }));
      return user;// return the instance
    },

    /**
     * Initializes a current user. Returns the current user, otherwise creates
     * an implicit user. This method is called internally when doing a network
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

      // No cached user available, create implicit user.
      return Kinvey.User.create({}, options);
    },

    /**
     * Resets password for a user.
     * 
     * @param {string} username User name.
     * @param {Object} [options]
     * @param {function()} [options.success] Success callback.
     * @param {function(error)} [options.error] Failure callback.
     */
    resetPassword: function(username, options) {
      var store = new Kinvey.Store.Rpc();
      store.resetPassword(username, options);
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
      var data = Storage.get(CACHE_TAG());
      if(null !== data && null != data.token && null != data.user) {
        new Kinvey.User(data.user)._login(data.token);
      }
    }
  });

}());
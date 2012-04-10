(function() {

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
      if(null !== deviceUser) {
        deviceUser.logout();
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

        // Update device status.
        deviceUser = this;
        this.isLoggedIn = true;

        bind(this, success)();
      }), bind(this, failure));
    },

    /**
     * Logs out user.
     * 
     */
    logout: function() {
      if(this.isLoggedIn) {
        deviceUser = null;
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
    }
  }, {
    /** @lends Kinvey.User */

    /**
     * Creates a new device user.
     * 
     * @param {string} [username] Username.
     * @param {string} [password] Password.
     * @param {function()} [success] Success callback. {this} is the User
     *          instance.
     * @param {function(Object)} [failure] Failure callback. {this} is the User
     *          instance. Only argument is an error object.
     * @return {Kinvey.User} The created user instance.
     */
    create: function(username, password, success, failure) {
      // Parse arguments.
      if('function' === typeof username) {// auto-generate credentials.
        success = username;
        failure = password;
        username = password = '';
      }
      else if('function' === typeof password) {// only auto-generate password.
        failure = success;
        success = password;
        password = '';
      }
      deviceUser = null;// reset device user.

      // Instantiate a user object.
      var user = new Kinvey.User();
      user.setUsername(username);
      user.setPassword(password);

      // Persist user, and link to device.
      Kinvey.Entity.prototype.save.call(user, function() {
        // Update device status.
        deviceUser = this;
        this.isLoggedIn = true;

        bind(this, success)();
      }, failure);

      // Return the instance.
      return user;
    }
  });

}());
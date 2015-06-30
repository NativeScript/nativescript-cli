import HttpMethod from '../enums/httpMethod';
import Kinvey from '../kinvey';
import Entity from './entity';
import utils from './utils';
import Request from './request';
import AuthType from '../enums/authType';
import Session from './session';
import log from './logger';
const currentUser = Symbol();

class User extends Entity {
  /**
   * Checks if the user is active.
   *
   * @returns {Boolean} `true` if the user is active, `false` otherwise.
   */
  isActive() {
    let currentUser = User.current;
    return this.data._id === currentUser.data._id;
  }

  /**
   * Logs out the user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  logout (options = {}) {
    // If this is not the current user then just resolve
    if (!this.isActive()) {
      return Promise.resolve();
    }

    // Debug
    log.info('Logging out the active user.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${Kinvey.appKey}/_logout`);

    // Set the auth type
    request.authType = AuthType.Session;

    // Execute the request
    let promise = request.execute(options).catch((response) => {
      let error = response.data;

      if (error.name === INVALID_CREDENTIALS || error.name === EMAIL_VERIFICATION_REQUIRED) {
        // Debug
        log.warn('The user credentials are invalid.');

        return null;
      }

      return Promise.reject(response);
    }).then(() => {
      // Reset the active user.
      let previous = Kinvey.setActiveUser(null);

      // Delete the auth token
      if (utils.isDefined(previous)) {
        delete previous._kmd.authtoken;
      }

      // Return the previous
      return previous;
    });

    // Debug
    promise.then((response) => {
      log.info(`Logged out the active user.`);
    }).catch((err) => {
      log.error(`Failed to logout the active user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Retrieves information on the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The active user.
   */
  me(options = {}) {
    // Debug
    log.info('Retrieving information on the active user.');

    // Create a request
    let request = new Request(HttpMethod.GET, `/user/${Kinvey.appKey}/_me`);

    // Set the auth type
    request.authType = AuthType.Session;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // The response.data is a fresh copy of the active user. However, the response
      // does not contain `_kmd.authtoken`. Therefore, extract it from the
      // stale copy.
      response.data._kmd.authtoken = this.data._kmd.authtoken;

      // Set the data for the user
      this.data = response.data;

      // Set the user as the current
      Kinvey.setActiveUser(this);

      // Return the user
      return this;
    });

    // Debug
    promise.then((response) => {
      log.info(`Retrieved information on the active user.`);
    }).catch((err) => {
      log.error(`Failed to retrieve information on the active user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Requests a password reset for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  resetPassword(username, options = {}) {
    // Debug
    log.info('Requesting a password reset.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${Kinvey.appKey}/${username}/user-password-reset-initiate`);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then((response) => {
      log.info(`Requested a password reset.`);
    }).catch((err) => {
      log.error(`Failed to request a password reset.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Signs up a new user.
   *
   * @param   {Object}  [data]    User data.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The new user.
   */
  static signup (data, options = {}) {
    // Debug
    log.info('Signing up a new user.');

    // Forward to `User.create()`. Signup always marks the created
    // user as the active user
    options.state = true;
    return User.create(data, options);
  }

  /**
   * Signs up a new user through a provider.
   *
   * @param {String}    provider  Provider.
   * @param {Object}    tokens    Tokens.
   * @param {Object}    [options] Options.
   * @returns {Promise}           The active user.
   */
  static signupWithProvider(provider, tokens, options = {}) {
    // Debug
    log.info('Signing up a new user with a provider.');

    // Parse tokens
    let data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.signup()`.
    return User.signup(data, options);
  }

  /**
   * Logs in an existing user.
   * NOTE If `options._provider`, this method should trigger a BL script.
   *
   * @param   {Object|string} usernameOrData      Username, or user data.
   * @param   {string}        [password]          Password.
   * @param   {Options}       [options]           Options.
   * @param   {boolean}       [options._provider] Login via Business Logic. May only
   *                                              be used internally to provide social
   *                                              login for browsers.
   * @returns {Promise}                           The active user.
  */
  static login(usernameOrData, password, options = {}) {
    // Reject if a user is already active
    if (utils.isDefined(Session.current)) {
      return Promise.reject(new Error('You are already logged in with another user.'));
    }

    // Cast arguments
    if (utils.isObject(usernameOrData)) {
      options = utils.isDefined(options) ? options : password;
    }
    else {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    // Default options
    options = options || {};

    // Validate username and password
    if ((!utils.isDefined(usernameOrData.username) || !utils.isDefined(usernameOrData.password)) && !utils.isDefined(usernameOrData._socialIdentity)) {
      return Promise.reject(new Error('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Debug
    log.info(`Login in a user.`);

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${Kinvey.appKey}/login`, null, usernameOrData);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current
      Kinvey.setActiveUser(user);

      // Return the user
      return user;
    });

    // Debug
    promise.then((response) => {
      log.info(`Logged in user ${response.data._id}.`);
    }).catch((err) => {
      log.error(`Failed to login the user.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Logs in an existing user through a provider.
   *
   * @param   {String}  provider  Provider.
   * @param   {Object}  tokens    Tokens.
   * @param   {Object}  [options] Options.
   * @returns {Promise}           The active user.
   */
  static loginWithProvider(provider, tokens, options) {
    // Debug.
    // if(KINVEY_DEBUG) {
    //   log('Logging in with a provider.', arguments);
    // }

    // Parse tokens.
    let data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.login()`.
    return User.login(data, options);
  }

  /**
   * Logs out the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  static logout() {
    // Forward to `user.logout()`.
    let user = User.current;
    return user.logout();
  }

  /**
   * Retrieves information on the active user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The active user.
   */
  static me(options = {}) {
    // Forward to `user.me()`.
    let user = User.current;
    return user.me();
  }

  /**
   * Requests email verification for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static verifyEmail(username, options = {}) {
    // Debug
    log.info('Requesting email verification.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${Kinvey.appKey}/${username}/user-email-verification-initiate`);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then((response) => {
      log.info(`Requested email verification.`);
    }).catch((err) => {
      log.error(`Failed to request email verification.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Requests a username reminder for a user.
   *
   * @param   {String}  email     Email.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static forgotUsername(email, options = {}) {
    // Debug
    log.info('Requesting a username reminder.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${Kinvey.appKey}/user-forgot-username`, null, {email: email});

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then((response) => {
      log.info(`Requested a username reminder.`);
    }).catch((err) => {
      log.error(`Failed to request a username reminder.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Requests a password reset for a user.
   *
   * @param   {String}  username  Username.
   * @param   {Options} [options] Options.
   * @returns {Promise}           The response.
   */
  static resetPassword(username, options = {}) {
    // Forward to `user.resetPassword()`.
    let user = User.current;
    return user.resetPassword();
  }

  /**
   * Checks whether a username exists.
   *
   * @param   {String}  username  Username to check.
   * @param   {Options} [options] Options.
   * @returns {Promise}           `true` if username exists, `false` otherwise.
   */
  static exists(username, options = {}) {
    // Debug
    log.info('Checking whether a username exists.');

    // Create a request
    let request = new Request(HttpMethod.POST, `/rpc/${Kinvey.appKey}/check-username-exists`, null, {username: username});

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Return the data
      return response.data;
    });

    // Debug
    promise.then((response) => {
      log.info(`Checked whether the username exists.`);
    }).catch((err) => {
      log.error(`Failed to check whather the username exists.`);
    });

    // Return the promise
    return promise;
  }

  /**
   * Creates a new user.
   *
   * @param   {Object}  [data]                User data.
   * @param   {Options} [options]             Options.
   * @param   {Boolean} [options.state=true]  Save the created user as the active
   *                                          user.
   * @returns {Promise}                       The new user.
   */
  static create(data = {}, options = {}) {
    // Debug
    log.info('Creating a new user.');

    // Validate preconditions
    if (options.state !== false && utils.isDefined(User.current)) {
      let error = new Error('Already logged in.');
      return Promise.reject(error);
    }

    // Create a request
    let request = new Request(HttpMethod.POST, `/user/${Kinvey.appKey}`, null, data);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current
      if (options.state !== false) {
        Kinvey.setActiveUser(user);
      }

      // Return the user
      return user;
    });

    // Debug
    promise.then((response) => {
      log.info(`Created the new user.`);
    }).catch((err) => {
      log.error(`Failed to create the new user.`);
    });

    // Return the promise
    return promise;
  }

  static update(data, options = {}) {
    // Forward to `user.update()`.
    let user = User.current;
    return user.update(data, options);
  }

  static find(query, options = {}) {
    let request;

    // Debug
    log.info('Retrieving users by query.');

    // Validate arguments
    if (!utils.isDefined(query) && !(query instanceof Query)) {
      let error = new Error('query argument must be of type: Kinvey.Query');
      return Promise.reject(error);
    }

    if (options.discover) {
      // Debug
      log.info('Using user discovery because of discover flag.');

      // Create a request
      request = new Request(HttpMethod.POST, `/user/${Kinvey.appKey}/_lookup`, query);
    }
    else {
      // Create a request
      request = new Request(HttpMethod.GET, `/user/${Kinvey.appKey}`, query);
    }

    // Set the auth type
    request.authType = AuthType.Default;

    // Execute the request
    let promise = request.execute(options);

    // Debug
    promise.then(function(response) {
      log.info('Retrieved the users by query.');
    }, function(error) {
      log.error('Failed to retrieve the users by query.');
    });

    // Return the promise
    return promise;
  }

  static get(id, options = {}) {

  }

  static destroy(id, options = {}) {
    // Forward to `user.destroy()`.
    let user = new User({
      _id: id
    });
    return user.destroy(options);
  }

  static restore(id, options = {}) {
    // Forward to `user.restore()`.
    let user = new User({
      _id: id
    });
    return user.restore(options);
  }

  static count(query, options = {}) {

  }

  static group(aggregation, options = {}) {

  }

  /**
   * Current user that is logged in.
   *
   * @return {User} The current user.
   */
  static get current() {
    let user = this[currentUser];

    if (!utils.isDefined(user)) {
      let session = Session.current;

      if (utils.isDefined(session)) {
        user = new User(session.user);
        this[currentUser] = user;
      }
    }

    return user;
  }
}

export default User;

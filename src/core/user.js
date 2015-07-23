import Entity from './entity';
import {isDefined} from '../utils';
import AuthType from '../enums/authType';
import Cache from './cache';
import log from 'loglevel';
import isFunction from 'lodash/lang/isFunction';
import isObject from 'lodash/lang/isObject';
import DataPolicy from '../enums/dataPolicy';
import ActiveUserError from './errors/activeUserError';
const activeUserSymbol = Symbol();
const activeUserKey = 'activeUser';

class User extends Entity {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Boolean} `true` if the user is active, `false` otherwise.
   */
  isActive() {
    const activeUser = User.getActive();

    if (isDefined(activeUser)) {
      return this._id === activeUser._id;
    }

    return false;
  }

  /**
   * Logs out the user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  logout() {
    const promise = Promise.resolve();

    // If this is not the current user then just resolve
    if (!this.isActive()) {
      return Promise.resolve();
    }

    // Debug
    log.info('Logging out the active user.');

    // // Create a request
    // let request = new Request(HttpMethod.POST, `/user/${kinvey.appKey}/_logout`);

    // // Set the auth type
    // request.authType = AuthType.Session;

    // // Execute the request
    // let promise = request.execute(options).catch((response) => {
    //   let error = response.data;

    //   if (error.name === INVALID_CREDENTIALS || error.name === EMAIL_VERIFICATION_REQUIRED) {
    //     // Debug
    //     log.warn('The user credentials are invalid.');

    //     return null;
    //   }

    //   return Promise.reject(response);
    // }).then(() => {
    //   // Reset the active user.
    //   let previous = kinvey.activeUser = null;

    //   // Delete the auth token
    //   if (utils.isDefined(previous)) {
    //     delete previous._kmd.authtoken;
    //   }

    //   // Return the previous
    //   return previous;
    // });
    //

    // Set the active user to null
    User.setActive(null);

    // Debug
    promise.then(() => {
      log.info(`Logged out the active user.`);
    }).catch(() => {
      log.error(`Failed to logout the active user.`);
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
  static signup(data, options = {}) {
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
    const data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.signup()`.
    return User.signup(data, options);
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
    if (options.state !== false && isDefined(User.getActive())) {
      const error = new ActiveUserError('A user is already logged in.');
      return Promise.reject(error);
    }

    // Set options
    options.dataPolicy = DataPolicy.CloudFirst;
    options.authType = AuthType.App;

    // Create a new user
    const promise = super.create(null, data, options).then((data) => {
      // Set the user data
      const user = new User(data);

      // Set the user as the active
      if (options.state !== false) {
        User.setActive(user);
      }

      // Return the user
      return user.toJSON();
    });

    // Return the promise
    return promise;
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
    if (isDefined(User.getActive())) {
      const error = new ActiveUserError('A user is already logged in.');
      return Promise.reject(error);
    }

    // Cast arguments
    if (isObject(usernameOrData)) {
      options = isDefined(options) ? options : password;
    } else {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    // Validate username and password
    if ((!isDefined(usernameOrData.username) || !isDefined(usernameOrData.password)) && !isDefined(usernameOrData._socialIdentity)) {
      return Promise.reject(new Error('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Set options
    options.dataPolicy = DataPolicy.CloudOnly;
    options.authType = AuthType.App;

    // Create a new user
    const promise = super.create('login', usernameOrData, options).then((data) => {
      // Set the user data
      const user = new User(data);

      // Set the user as the active
      User.setActive(user);

      // Return the user
      return user;
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
    // Parse tokens.
    const data = {_socialIdentity: {}};
    data._socialIdentity[provider] = tokens;

    // Forward to `User.login()`.
    return User.login(data, options);
  }

  static get(id, options = {}) {
    return super.get('_lookup', id, options);
  }

  /**
   * Current user that is logged in.
   *
   * @return {User} The current user.
   */
  static getActive() {
    let user = User[activeUserSymbol];
    const cache = Cache.instance();

    // Check cache
    if (!isDefined(user)) {
      const cachedUser = cache.get(activeUserKey);

      if (isDefined(cachedUser)) {
        user = new User(cachedUser);
        User[activeUserSymbol] = user;
      }
    }

    return user;
  }

  static setActive(user) {
    let activeUser = User.getActive();
    const cache = Cache.instance();

    // Remove the current user
    if (isDefined(activeUser)) {
      // Remove the current user from cache
      cache.del(activeUserKey);

      // Set the current user to null
      User[activeUserSymbol] = null;

      // Debug
      log.info(`Removed the active user with _id ${activeUser._id}.`);
    }

    // Create a new user
    if (isDefined(user)) {
      if (!(user instanceof User)) {
        // Call toJSON if it is available
        if (isFunction(user.toJSON)) {
          user = user.toJSON();
        }

        // Create the user
        activeUser = new User(user);
      } else {
        activeUser = user;
      }

      // Store in cache
      cache.set(activeUserKey, activeUser.toJSON());

      // Set the current user
      User[activeUserSymbol] = activeUser;

      // Debug
      log.info(`Set active user with _id ${activeUser._id}`);
    }
  }
}

// Set the active user to null initially
User[activeUserSymbol] = null;

export default User;

import Model from './model';
import AuthType from '../enums/authType';
import Cache from './cache';
import DataPolicy from '../enums/dataPolicy';
import Request from './request';
import HttpMethod from '../enums/httpMethod';
import Kinvey from '../kinvey';
import ActiveUserError from './errors/activeUserError';
import assign from 'lodash/object/assign';
import isFunction from 'lodash/lang/isFunction';
import isDefined from '../utils/isDefined';
import isObject from 'lodash/lang/isObject';
const activeUserSymbol = Symbol();
const activeUserKey = 'activeUser';
const userPath = '/user';

class User extends Model {
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
      return this.id === activeUser.id;
    }

    return false;
  }

  /**
   * Logs out the user.
   *
   * @param   {Options} [options] Options.
   * @returns {Promise}           The previous active user.
   */
  logout(options = {}) {
    // If this is not the current user then just resolve
    if (!this.isActive()) {
      return Promise.resolve();
    }

    // Set default options
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.Session,
      client: Kinvey.sharedInstance()
    }, options);
    const path = `${userPath}/${options.client.appKey}/_logout`;

    // Send logout request
    const request = new Request(HttpMethod.DELETE, path, null, null, options);
    const promise = request.execute().then(() => {
      // Set the active user to null
      User.setActive(null);
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
  static login(username, password, options = {}) {
    // Unable to login if an active user already exists.
    if (isDefined(User.getActive())) {
      const error = new ActiveUserError('A user is already logged in.');
      return Promise.reject(error);
    }

    // Handle both `username, password` and
    // `{username: username, password: password}` style arguments.
    let data = {};
    if (isObject(username)) {
      data = username;
      options = password;
    } else {
      data = {
        username: username,
        password: password
      };
    }

    // Validate username and password.
    if ((!isDefined(data.username) || !isDefined(data.password)) && !isDefined(data._socialIdentity)) {
      return Promise.reject(new Error('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Set default options
    options = assign({
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.App,
      client: Kinvey.sharedInstance(),
      parse: true
    }, options);
    const path = `${userPath}/${options.client.appKey}/login`;

    // Send login request
    const request = new Request(HttpMethod.POST, path, null, data, options);
    const promise = request.execute().then((response) => {
      const user = new User(response.data);
      let serverAttrs = options.parse ? user.parse(data, options) : data;
      serverAttrs = assign({}, data, serverAttrs);

      if (serverAttrs && !user.set(serverAttrs, options)) {
        return false;
      }

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
    // Handle both `provider, tokens` and
    // `{_socialIdeneity: {provider: tokens}}` style arguments.
    let data = {};
    if (isObject(provider)) {
      data = provider;
      options = tokens;
    } else {
      data = { _socialIdentity: {} };
      data._socialIdentity[provider] = tokens;
    }

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
    const cache = Cache.sharedInstance();

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
    const cache = Cache.sharedInstance();

    // Remove the current user
    if (isDefined(activeUser)) {
      // Remove the current user from cache
      cache.del(activeUserKey);

      // Set the current user to null
      User[activeUserSymbol] = null;
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
    }
  }
}

// Set the active user to null initially
User[activeUserSymbol] = null;

export default User;

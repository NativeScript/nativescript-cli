import HttpMethod from '../enums/httpMethod';
import Kinvey from '../kinvey';
import Entity from './entity';
import utils from './utils';
import NetworkRequest from './networkRequest';
import AuthType from '../enums/authType';
import Session from './session';
import log from './logger';
const currentUser = Symbol();

class User extends Entity {
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

    // Create a network request
    let request = new NetworkRequest(HttpMethod.POST, `/user/${Kinvey.appKey}/login`, null, usernameOrData);

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    let promise = request.execute(options).then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current
      Kinvey.setActiveUser(user);

      // // Save the user locally
      // return user.save({
      //   local: true
      // });

      // Return the user
      return user;
    });

    // Debug
    promise.then((response) => {
      log.info(`Logged in user ${response.data._id}.`);
    }).catch((err) {
      log.error(`Failed to login the user. ${err}`);
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
    let data = { _socialIdentity: { } };
    data._socialIdentity[provider] = tokens;

    // Forward to `User.login()`.
    return User.login(data, options);
  },

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

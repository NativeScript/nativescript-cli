const KinveyError = require('../errors').KinveyError;
const ActiveUserError = require('../errors').ActiveUserError;
const Model = require('./model');
const Request = require('../request').Request;
const Client = require('../client');
const HttpMethod = require('../enums').HttpMethod;
const DataPolicy = require('../enums').DataPolicy;
const Auth = require('../auth');
const isString = require('lodash/lang/isString');
const isObject = require('lodash/lang/isObject');
const result = require('lodash/object/result');
const assign = require('lodash/object/assign');
const Promise = require('bluebird');
const UserUtils = require('../../utils/user');
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';

class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static getActive(client = Client.sharedInstance()) {
    const promise = UserUtils.getActive(client).then(data => {
      if (data) {
        return new User(data);
      }

      return null;
    });
    return promise;
  }

  /**
   * Stores the active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static setActive(user, client = Client.sharedInstance()) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user));
    }

    const promise = UserUtils.setActive(user.toJSON(), client).then(data => {
      if (data) {
        return new User(data);
      }

      return null;
    });
    return promise;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Promise} Resolved with `true` if the user is active, `false` otherwise.
   */
  isActive(client) {
    return User.getActive(client).then(user => {
      if (user) {
        return this.id === user.id;
      }

      return false;
    });
  }

  /**
   * Login a user. A promise will be returned that will be resolved with a
   * user or rejected with an error.
   *
   * @param   {string|Object} usernameOrData Username or login data
   * @param   {string} [password] Password
   * @param   {Options} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * Kinvey.User.login('admin', 'admin').then(function(user) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  static login(usernameOrData, password, options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const promise = User.getActive(options.client).then(user => {
      if (user) {
        throw new ActiveUserError('A user is already logged in.');
      }

      options.method = HttpMethod.POST;
      options.path = `/${usersNamespace}/${options.client.appId}/login`;
      options.data = usernameOrData;
      options.dataPolicy = DataPolicy.CloudOnly;
      options.auth = Auth.app;

      if (!isObject(usernameOrData)) {
        usernameOrData = {
          username: usernameOrData,
          password: password
        };
        options.data = usernameOrData;
      }

      if ((!usernameOrData.username || !usernameOrData.password) && !usernameOrData._socialIdentity) {
        throw new KinveyError(
          'Username and/or password missing. Please provide both a username and password to login.'
        );
      }

      const request = new Request(options);
      return request.execute();
    }).then(response => {
      const user = new User(response.data);
      return User.setActive(user, options.client);
    });

    return promise;
  }

  /**
   * Login a Kinvey user using a provider.
   *
   * @param   {string}        provider            Provider
   * @param   {Object}        token               Token
   * @param   {string}        token.access_token  Access token
   * @param   {number}        token.expires_in    Expires in
   * @param   {Options}       [options]           Options
   * @returns {Promise}                           Resolved with the active user or rejected with an error.
  */
  static loginWithProvider(provider, token = {}, options) {
    if (!isString(provider)) {
      provider = String(provider);
    }

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (!token.access_token || !token.expires_in) {
      return Promise.reject(
        new KinveyError('token argument must contain both an access_token and expires_in property.', token)
      );
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    const data = { _socialIdentity: { } };
    data._socialIdentity[provider] = token;

    return User.login(data, options);
  }

  /**
   * Connect with a social identity.
   *
   * @param   {string|Object}      Adapter          Social Adapter
   * @return  {Promise}                             Resolved with the active user or rejected with an error.
   */

  // static connect(Adapter = SocialAdapter.Facebook, options) {
  //   let adapter = Adapter;
  //   let promise;
  //
  //   if (isString(Adapter)) {
  //     switch (Adapter) {
  //     case SocialAdapter.Google:
  //       Adapter = Google;
  //       break;
  //     case SocialAdapter.LinkedIn:
  //       Adapter = LinkedIn;
  //       break;
  //     case SocialAdapter.Twitter:
  //       Adapter = Twitter;
  //       break;
  //     default:
  //       Adapter = Facebook;
  //     }
  //   }
  //
  //   if (isFunction(Adapter)) {
  //     adapter = new Adapter();
  //   }
  //
  //   if (!isFunction(adapter.connect)) {
  //     return Promise.reject(
  //       new KinveyError('Unable to connect with the social adapter.',
  //                       'Please provide a connect function for the adapter.')
  //     );
  //   }
  //
  //   promise = adapter.connect(options).then((token) => {
  //     return User.loginWithProvider(adapter.name, token, options);
  //   });
  //
  //   return promise;
  // }

  /**
   * Logout the active user. A promise will be returned that will be resolved
   * with null or rejected with an error.
   *
   * @param {Object} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * var user = Kinvey.User.getActive();
   * user.logout().then(function() {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  logout(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const promise = this.isActive().then(active => {
      if (!active) {
        return null;
      }

      options.method = HttpMethod.POST;
      options.path = `/${usersNamespace}/${options.client.appId}/_logout`;
      options.dataPolicy = DataPolicy.CloudOnly;
      options.auth = Auth.session;

      const request = new Request(options);
      return request.execute();
    }).then(() => {
      return User.setActive(null, options.client);
    });

    return promise;
  }
}

module.exports = User;

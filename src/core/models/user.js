const KinveyError = require('../errors').KinveyError;
const AlreadyLoggedInError = require('../errors').AlreadyLoggedInError;
const Model = require('./model');
const Request = require('../request').Request;
const HttpMethod = require('../enums').HttpMethod;
const DataPolicy = require('../enums').DataPolicy;
const Auth = require('../auth');
const isObject = require('lodash/lang/isObject');
const result = require('lodash/object/result');
const assign = require('lodash/object/assign');
const UserUtils = require('../utils/user');
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * The pathname for the users where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getPathname(client) {
    client = client || this.client;
    return `/${usersNamespace}/${client.appId}`;
  }

  /**
   * The pathname for the rpc where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getRpcPathname(client) {
    client = client || this.client;
    return `/${rpcNamespace}/${client.appId}`;
  }

  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static getActive(options = {}) {
    const promise = UserUtils.getActive(options).then(data => {
      if (data) {
        return new User(data, options);
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
  static setActive(user, options = {}) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user), options);
    }

    const promise = UserUtils.setActive(user, options).then(data => {
      if (data) {
        return new User(data, options);
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
  isActive(options = {}) {
    return User.getActive(options).then(user => {
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
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    const user = new User(usernameOrData, options);
    return user.login();
  }

  login(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = User.getActive(options).then(activeUser => {
      if (activeUser) {
        throw new AlreadyLoggedInError('A user is already logged in.');
      }

      if ((!this.get('username') || !this.get('password')) && !this.get('_socialIdentity')) {
        throw new KinveyError(
          'Username and/or password missing. Please provide both a username and password to login.'
        );
      }

      const request = new Request({
        method: HttpMethod.POST,
        pathname: `${this.getPathname(this.client)}/login`,
        data: this.toJSON(),
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.app,
        client: this.client
      });
      return request.execute();
    }).then(response => {
      this.set(response.data, options);
      this.unset('password');
      return User.setActive(this, options);
    });

    return promise;
  }

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
      client: this.client
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        return null;
      }

      const request = new Request({
        method: HttpMethod.POST,
        pathname: `${this.getPathname(options.client)}/_logout`,
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.session,
        client: options.client
      });
      return request.execute();
    }).then(() => {
      return User.setActive(null, options.client);
    });

    return promise;
  }

  me(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        throw new KinveyError('User is not active. Please login first.');
      }

      const request = new Request({
        method: HttpMethod.GET,
        pathname: `${this.getPathname(options.client)}/_me`,
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.session,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      const user = new User(response.data);

      if (!user.kmd.authtoken) {
        return User.getActive().then(activeUser => {
          const kmd = user.kmd;
          kmd.authtoken = activeUser.kmd.authtoken;
          user.kmd = kmd;
          return user;
        });
      }

      return user;
    }).then(user => {
      return User.setActive(user, options.client);
    });

    return promise;
  }

  verifyEmail(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new Request({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-email-verification-initiate`,
      dataPolicy: DataPolicy.NetworkOnly,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }

  forgotUsername(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new Request({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/user-forgot-username`,
      dataPolicy: DataPolicy.NetworkOnly,
      auth: Auth.app,
      client: options.client,
      data: { email: this.get('email') }
    });
    const promise = request.execute();
    return promise;
  }

  resetPassword(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new Request({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-password-reset-initiate`,
      dataPolicy: DataPolicy.NetworkOnly,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }
}

module.exports = User;

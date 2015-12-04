const KinveyError = require('../errors').KinveyError;
const ActiveUserError = require('../errors').ActiveUserError;
const Model = require('./model');
const Request = require('../request').Request;
const Client = require('../client');
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

    const promise = UserUtils.setActive(user, client).then(data => {
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

      const request = new Request({
        method: HttpMethod.POST,
        pathname: `/${usersNamespace}/${options.client.appId}/login`,
        data: usernameOrData,
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.app,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      const user = new User(response.data);
      return User.setActive(user, options.client);
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
      client: Client.sharedInstance()
    }, options);

    const promise = this.isActive().then(active => {
      if (!active) {
        return null;
      }

      options.method = HttpMethod.POST;
      options.pathname = `/${usersNamespace}/${options.client.appId}/_logout`;
      options.dataPolicy = DataPolicy.NetworkOnly;
      options.auth = Auth.session;

      const request = new Request(options);
      return request.execute();
    }).then(() => {
      return User.setActive(null, options.client);
    });

    return promise;
  }

  me(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const promise = this.isActive().then(active => {
      if (!active) {
        throw new KinveyError('User is not active. Please login first.');
      }

      options.method = HttpMethod.GET;
      options.pathname = `/${usersNamespace}/${options.client.appId}/_me`;
      options.dataPolicy = DataPolicy.NetworkOnly;
      options.auth = Auth.session;

      const request = new Request(options);
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
      client: Client.sharedInstance()
    }, options);

    options.method = HttpMethod.POST;
    options.pathname = `/${rpcNamespace}/${options.client.appId}/${this.get('username')}/user-email-verification-initiate`;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.auth = Auth.app;

    const request = new Request(options);
    const promise = request.execute();
    return promise;
  }

  forgotUsername(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    options.method = HttpMethod.POST;
    options.pathname = `/${rpcNamespace}/${options.client.appId}/user-forgot-username`;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.auth = Auth.app;
    options.data = { email: this.get('email') };

    const request = new Request(options);
    const promise = request.execute();
    return promise;
  }

  resetPassword(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    options.method = HttpMethod.POST;
    options.pathname = `/${rpcNamespace}/${options.client.appId}/${this.get('username')}/user-password-reset-initiate`;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.auth = Auth.app;

    const request = new Request(options);
    const promise = request.execute();
    return promise;
  }

  resetPassword(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    options.method = HttpMethod.POST;
    options.pathname = `/${rpcNamespace}/${options.client.appId}/${this.get('username')}/user-password-reset-initiate`;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.auth = Auth.app;

    const request = new Request(options);
    const promise = request.execute();
    return promise;
  }
}

module.exports = User;

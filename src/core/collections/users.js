import Client from '../client';
import Auth from '../auth';
import DataPolicy from '../enums/dataPolicy';
import { Request } from '../request';
import HttpMethod from '../enums/httpMethod';
import Datastore from './datastore';
import { KinveyError } from '../errors';
import Query from '../query';
import when from 'when';
import assign from 'lodash/object/assign';
import isObject from 'lodash/lang/isObject';
import isArray from 'lodash/lang/isArray';
const usersNamespace = 'user';
const rpcNamespace = 'rpc';

/**
 * The Users class is used to perform operations on users on the Kinvey platform.
 *
 * @example
 * var users = new Kinvey.Users();
 */
export default class Users extends Datastore {
  /**
   * Creates a new instance of the Users class.
   *
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(client = Client.sharedInstance()) {
    super(null, client);
  }

  /**
   * The path for the users where requests will be sent.
   *
   * @return   {string}    Path
   */
  get path() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  /**
   * The path for the rpc where requests will be sent.
   *
   * @return   {string}    Path
   */
  get rpcPath() {
    return `/${rpcNamespace}/${this.client.appKey}`;
  }

  /**
   * Login a user. A promise will be returned that will be resolved with a
   * user or rejected with an error.
   *
   * @param   {string|Object} usernameOrData                              Username or login data
   * @param   {string}        [password]                                  Password
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var users = new Kinvey.Users();
   * users.login('admin', 'foo').then(function(user) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  login(usernameOrData, password, options = {}) {
    // Set options
    options.dataPolicy = DataPolicy.CloudOnly;
    options.auth = Auth.app;

    // Cast arguments
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    // Validate arguments
    if ((!usernameOrData.username || !usernameOrData.password) && !usernameOrData._socialIdentity) {
      return when.reject(new KinveyError('Username and/or password missing. Please provide both a username and password to login.'));
    }

    // Create and execute a request
    const request = new Request(HttpMethod.POST, `${this.path}/login`, null, usernameOrData, options);
    const promise = request.execute().then(response => {
      return new this.model(response.data, options);
    });

    // Return the promise
    return promise;
  }

  /**
   * Logout the active user. A promise will be returned that will be resolved
   * with null or rejected with an error.
   *
   * @return  {Promise}                                                   Promise
   *
   * @example
   * var users = new Kinvey.Users();
   * users.logout().then(function() {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  logout(options = {}) {
    // Set options
    options.dataPolicy = DataPolicy.CloudOnly;
    options.auth = Auth.session;

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.path}/_logout`, null, null, options);
    const promise = request.execute().then(() => {
      return null;
    });

    // Return the promise
    return promise;
  }

  find(query, options = {}) {
    let promise;

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    if (options.discover) {
      // Create and execute the request
      const request = new Request(HttpMethod.POST, `${this.path}/_lookup`, null, query, options); // TODO: should be query.toJSON().filter
      promise = request.execute().then(response => {
        let data = response.data;
        const models = [];

        if (!isArray(data)) {
          data = [data];
        }

        data.forEach(doc => {
          models.push(new this.model(doc, options));
        });

        return models;
      });
    } else {
      promise = super.find(query, options);
    }

    // Return the promise;
    return promise;
  }

  verifyEmail(username, options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.app
    }, options);

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.rpcPath}/${username}/user-email-verification-initiate`, null, null, options);
    const promise = request.execute().then(() => {
      return null;
    });

    // Return the promise
    return promise;
  }

  forgotUsername(email, options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.app
    }, options);

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.rpcPath}/user-forgot-username`, { email: email }, null, options);
    const promise = request.execute().then(() => {
      return null;
    });

    // Return the promise
    return promise;
  }

  resetPassword(username, options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.app
    }, options);

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.rpcPath}/${username}/user-password-reset-initiate`, null, null, options);
    const promise = request.execute().then(() => {
      return null;
    });

    // Return the promise
    return promise;
  }

  exists(username, options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.app
    }, options);

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.rpcPath}/check-username-exists`, { username: username }, null, options);
    const promise = request.execute().then(() => {
      const data = response.data;

      if (data) {
        return data.usernameExists;
      }

      return false;
    });

    // Return the promise
    return promise;
  }

  restore(id, options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      auth: Auth.master
    }, options);

    // Create and execute the request
    const request = new Request(HttpMethod.POST, `${this.path}/${id}/_restore`, null, null, options);
    const promise = request.execute().then(() => {
      return null;
    });

    // Return the promise
    return promise;
  }
}

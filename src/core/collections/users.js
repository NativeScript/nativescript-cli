const Auth = require('../auth');
const DataPolicy = require('../enums/dataPolicy');
const Request = require('../request').Request;
const HttpMethod = require('../enums/httpMethod');
const Collection = require('./collection');
const Query = require('../query');
const User = require('../models/user');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const isArray = require('lodash/lang/isArray');
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * The Users class is used to perform operations on users on the Kinvey platform.
 *
 * @example
 * var users = new Kinvey.Users();
 */
class Users extends Collection {
  /**
   * Creates a new instance of the Users class.
   *
   * @param   {Client}    [client=Client.sharedInstance()]            Client
   */
  constructor(options = {}) {
    options.model = User;
    super('users', options);
  }

  /**
   * The pathname for the users where requests will be sent.
   *
   * @return   {string}    Path
   */
  get pathname() {
    return `/${usersNamespace}/${this.client.appId}`;
  }

  /**
   * The pathname for the rpc where requests will be sent.
   *
   * @return   {string}    Path
   */
  get rpcPathname() {
    return `/${rpcNamespace}/${this.client.appId}`;
  }

  find(query, options = {}) {
    let promise;

    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.default
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.pathname}/_lookup`;
    options.query = query;

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
      options.query = query;
    }

    if (options.discover) {
      const request = new Request(options); // TODO: should be query.toJSON().filter
      promise = request.execute().then(response => {
        let data = response.data;
        const models = [];

        if (!isArray(data)) {
          data = [data];
        }

        data.forEach(doc => {
          models.push(new this.model(doc, options)); // eslint-disable-line new-cap
        });

        return models;
      });
    } else {
      promise = super.find(query, options);
    }

    return promise;
  }

  verifyEmail(username, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.app
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.rpcPathname}/${username}/user-email-verification-initiate`;

    const request = new Request(options);
    const promise = request.execute().then(() => {
      return null;
    });

    return promise;
  }

  forgotUsername(email, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.app
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.rpcPathname}/user-forgot-username`;
    options.data = { email: email };

    const request = new Request(options);
    const promise = request.execute().then(() => {
      return null;
    });
    return promise;
  }

  resetPassword(username, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.app
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.rpcPathname}/${username}/user-password-reset-initiate`;

    const request = new Request(options);
    const promise = request.execute().then(() => {
      return null;
    });

    return promise;
  }

  exists(username, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.app
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.rpcPathname}/check-username-exists`;
    options.data = { username: username };

    const request = new Request(options);
    const promise = request.execute().then(response => {
      const data = response.data;

      if (data) {
        return data.usernameExists;
      }

      return false;
    });

    return promise;
  }

  restore(id, options = {}) {
    options = assign({
      dataPolicy: DataPolicy.NetworkFirst,
      auth: Auth.master
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.pathname}/${id}/_restore`;

    const request = new Request(options);
    const promise = request.execute().then(() => {
      return null;
    });

    return promise;
  }
}

module.exports = Users;

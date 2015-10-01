import AuthType from '../enums/authType';
import DataPolicy from '../enums/dataPolicy';
import Request from '../request';
import HttpMethod from '../enums/httpMethod';
import Datastore from './datastore';
import when from 'when';
import assign from 'lodash/object/assign';
import isObject from 'lodash/lang/isObject';
const usersNamespace = 'user';
const rpcNamespace = 'rpc';
const pathReplaceRegex = /[^\/]$/;

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
   * @param   {Client}    [client=Kinvey.sharedInstance()]            Client
   */
  constructor(client = Kinvey.sharedClientInstance()) {
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
  login(usernameOrData, password) {
    // Set options
    const options = {
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.App
    };

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

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent('login')}`;

    // Create and execute a request
    const request = new Request(HttpMethod.POST, path, null, usernameOrData, options);
    const promise = request.execute();

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
  logout() {
    // Set options. These values will be overridden
    // if the option was provided.
    const options = {
      dataPolicy: DataPolicy.CloudOnly,
      authType: AuthType.Session
    };

    // Create the request path
    const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent('_logout')}`;

    // Create and execute the request
    const request = new Request(HttpMethod.POST, path, null, null, options);
    const promise = request.execute();

    // Return the promise
    return promise;
  }

  find(query, options = {}) {
    let promise;

    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    // Check that the query is an instance of Query
    if (query && !(query instanceof Query)) {
      query = new Query(isFunction(query.toJSON) ? query.toJSON() : query);
    }

    if (options.discover) {
      // Create the request path
      const path = `${this.path.replace(pathReplaceRegex, '$&/')}${encodeURIComponent('_lookup')}`;

      // Create and execute the request
      const request = new Request(HttpMethod.POST, path, null, query.toJSON().filter, options);
      promise = request.execute();
    } else {
      promise = super.find(query, options);
    }

    // Return the promise;
    return promise;
  }

  verifyEmail(models = [], options = {}) {
    // Set option defaults. These values will be overridden
    // if the option was provided.
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const prevName = this.name;
        this.name = model.get('username');
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-email-verification-initiate`, null, null, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
          this.name = prevName;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  forgotUsername(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('email')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-forgot-username`, null, {email: model.get('email')}, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  resetPassword(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.App
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const prevName = this.name;
        this.name = model.get('username');
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/user-password-reset-initiate`, null, null, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
          this.name = prevName;
        });
      } else {
        promise = when.resolve({});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  exists(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);
      let promise;

      if (!model) {
        promises.push(Promise.reject(new Error('Model required')));
        continue;
      }

      if (model.has('username')) {
        const prevNamespace = this.namespace;
        this.namespace = rpcNamespace;
        const path = this.path;
        const request = new Request(HttpMethod.POST, `${path}/check-username-exists`, null, {username: model.get('username')}, opts);

        promise = request.execute().then((response) => {
          return response.data;
        }).finally(() => {
          this.namespace = prevNamespace;
        });
      } else {
        promise = when.resolve({usernameExists: false});
      }

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }

  restore(models = [], options = {}) {
    options = assign({
      dataPolicy: DataPolicy.CloudFirst,
      authType: AuthType.Default,
      parse: true
    }, options);

    const singular = !isArray(models);
    models = singular ? [models] : models.slice();
    const promises = [];

    for (let i = 0, len = models.length; i < len; i++) {
      const model = this._prepareModel(models[i], options);
      const opts = clone(options, true);

      if (!model) {
        promises.push(Promise.reject(new KinveyError('Model required')));
        continue;
      }

      const prevName = this.name;
      this.name = id;
      const path = this.path;
      const request = new Request(HttpMethod.POST, `${path}/_restore`, null, null, opts);
      const promise = request.execute().then((response) => {
        let data = response.data;

        if (opts.parse) {
          data = this.parse(data);
        }

        return data;
      }).finally(() => {
        this.name = prevName;
      });

      promises.push(promise);
    }

    return Promise.all(promises).then((responses) => {
      return singular ? responses[0] : responses;
    });
  }
}

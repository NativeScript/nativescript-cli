const Auth = require('../auth');
const DataPolicy = require('../enums').DataPolicy;
const AlreadyLoggedInError = require('../errors').AlreadyLoggedInError;
const UserNotFoundError = require('../errors').UserNotFoundError;
const Request = require('../request').Request;
const HttpMethod = require('../enums').HttpMethod;
const NetworkStore = require('./networkStore');
const Query = require('../query');
const User = require('../models/user');
const assign = require('lodash/object/assign');
const result = require('lodash/object/result');
const forEach = require('lodash/collection/forEach');
const isArray = require('lodash/lang/isArray');
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * The Users class is used to perform operations on users on the Kinvey platform.
 *
 * @example
 * var users = new Kinvey.Users();
 */
class Users extends NetworkStore {
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

  find(query, options = {}) {
    let promise;

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    if (options.discover) {
      const request = new Request({
        dataPolicy: options.dataPolicy,
        auth: options.auth,
        client: options.client,
        method: HttpMethod.POST,
        pathname: `${this.getPathname(options.client)}/_lookup`,
        data: query ? query.toJSON().filter : null
      });
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

  signup(user, options = {}) {
    options.state = true;

    if (!(user instanceof this.model)) {
      user = new this.model(result(user, 'toJSON', user), options); // eslint-disable-line new-cap
    }

    user.id = undefined; // Remove the id
    return this.create(user, options);
  }

  create(user, options = {}) {
    options = assign({
      client: this.client,
      state: false
    }, options);
    options.dataPolicy = DataPolicy.ForceNetwork;
    options.auth = Auth.app;

    const promise = User.getActive(options).then(activeUser => {
      if (options.state && activeUser) {
        throw new AlreadyLoggedInError('A user is already logged in. Please logout before saving the new user.');
      }

      if (!(user instanceof this.model)) {
        user = new this.model(result(user, 'toJSON', user), options); // eslint-disable-line new-cap
      }

      return super.create(user, options);
    }).then(user => {
      if (options.state) {
        return User.setActive(user, options.client);
      }

      return user;
    });

    return promise;
  }

  update(user, options = {}) {
    options = assign({
      client: this.client
    }, options);

    if (!user) {
      return Promise.resolve(null);
    }

    if (!(user instanceof this.model)) {
      user = new this.model(result(user, 'toJSON', user), options); // eslint-disable-line new-cap
    }

    const socialIdentity = user.get('_socialIdentity');
    const tokens = [];

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    if (socialIdentity) {
      for (const identity in socialIdentity) {
        if (socialIdentity.hasOwnProperty(identity)) {
          if (socialIdentity[identity] && identity !== options._provider) {
            tokens.push({
              provider: identity,
              access_token: socialIdentity[identity].access_token,
              access_token_secret: socialIdentity[identity].access_token_secret
            });
            delete socialIdentity[identity].access_token;
            delete socialIdentity[identity].access_token_secret;
          }
        }
      }
    }

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    user.set('_socialIdentity', socialIdentity);
    const promise = super.update(user, options).then(user => {
      const socialIdentity = user.get('_socialIdentity');

      forEach(tokens, identity => {
        const provider = identity.provider;

        if (socialIdentity && socialIdentity[provider]) {
          forEach(['access_token', 'access_token_secret'], field => {
            if (identity[field]) {
              socialIdentity[provider][field] = identity[field];
            }
          });
        }
      });

      user.set('_socialIdentity', socialIdentity);
      return User.getActive(options).then(activeUser => {
        if (activeUser && activeUser.id === user.id) {
          return User.setActive(user, options.client);
        }

        return user;
      });
    });

    return promise;
  }

  delete(id, options = {}) {
    options = assign({
      client: this.client,
      search: options.hard ? { hard: true } : {}
    }, options);

    const promise = super.delete(id, options).then(response => {
      return User.getActive(options).then(activeUser => {
        if (activeUser && activeUser.id === id) {
          return User.setActive(null, options.client);
        }
      }).then(() => {
        return response;
      });
    }).catch(err => {
      if (options.silent && err instanceof UserNotFoundError) {
        return null;
      }

      throw err;
    });

    return promise;
  }

  exists(username, options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new Request({
      dataPolicy: DataPolicy.ForceNetwork,
      auth: Auth.app,
      client: options.client,
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/check-username-exists`,
      data: { username: username }
    });
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
      client: this.client
    }, options);

    const request = new Request({
      dataPolicy: DataPolicy.ForceNetwork,
      auth: Auth.master,
      client: options.client,
      method: HttpMethod.POST,
      pathname: `${this.getPathname(options.client)}/${id}/_restore`
    });
    const promise = request.execute();
    return promise;
  }
}

module.exports = Users;

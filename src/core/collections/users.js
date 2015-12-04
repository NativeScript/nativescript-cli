const Auth = require('../auth');
const DataPolicy = require('../enums/dataPolicy');
const AlreadyLoggedInError = require('../errors').AlreadyLoggedInError;
const UserNotFoundError = require('../errors').UserNotFoundError;
const Request = require('../request').Request;
const HttpMethod = require('../enums/httpMethod');
const Collection = require('./collection');
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

    if (query && !(query instanceof Query)) {
      query = new Query(result(query, 'toJSON', query));
    }

    options = assign({
      dataPolicy: this.dataPolicy,
      auth: this.auth,
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.POST;
    options.pathname = `${this.getPathname(options.client)}/_lookup`;

    if (options.discover) {
      options.data = query ? query.toJSON().filter : null;
      const request = new Request(options);
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

  create(user, options = {}) {
    const promise = User.getActive().then(activeUser => {
      if (options.state && activeUser) {
        throw new AlreadyLoggedInError('A user is already logged in. Please logout before saving the new user.');
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
    if (!user) {
      return Promise.resolve(null);
    }

    if (!(user instanceof this.model)) {
      user = new this.model(result(user, 'toJSON', user), options); // eslint-disable-line new-cap
    }

    const socialIdentity = user.get('_socialIdentity');
    const tokens = [];

    if (socialIdentity) {
      for (const identity in socialIdentity) {
        if (socialIdentity.hasOwnProperty(identity)) {
          if (socialIdentity[identity] && identity !== options._provider) {
            tokens.push({
              provider: identity,
              access_token: socialIdentity[identity].access_token;
              access_token_secret: socialIdentity[identity].access_token_secret;
            });
            delete socialIdentity[identity].access_token;
            delete socialIdentity[identity].access_token_secret;
          }
        }
      }
    }

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
      return User.getActive().then(activeUser => {
        if (activeUser && activeUser.id === user.id) {
          return User.setActive(user, options.client);
        }

        return user;
      });
    });
  }

  delete(id, options = {}) {
    options = assign({
      client: this.client,
      search: options.hard ? { hard: true } : {}
    }, options);

    const promise = super.delete(id, options).then(response => {
      return User.getActive().then(activeUser => {
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
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.POST;
    options.auth = Auth.app;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.pathname = `${this.getRpcPathname(options.client)}/check-username-exists`;
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
      client: this.client,
      skipSync: this.skipSync
    }, options);
    options.method = HttpMethod.POST;
    options.auth = Auth.master;
    options.dataPolicy = DataPolicy.NetworkOnly;
    options.pathname = `${this.getPathname(options.client)}/${id}/_restore`;

    const request = new Request(options);
    const promise = request.execute();
    return promise;
  }
}

module.exports = Users;

import Auth from '../auth';
import { ReadPolicy as DataPolicy, HttpMethod } from '../enums';
import { NotFoundError } from '../errors';
import Request from '../requests/networkRequest';
import Store from './store';
import Query from '../query';
import User from '../models/user';
import assign from 'lodash/object/assign';
import result from 'lodash/object/result';
import isArray from 'lodash/lang/isArray';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * The Users class is used to perform operations on users on the Kinvey platform.
 *
 * @example
 * var users = new Kinvey.Users();
 */
export default class Users extends Store {
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
      client: this.client
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

  delete(id, options = {}) {
    options = assign({
      client: this.client,
      flags: options.hard ? { hard: true } : {}
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
      if (options.silent && err instanceof NotFoundError) {
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

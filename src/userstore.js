/* eslint-disable no-underscore-dangle */
import { KinveyError } from './errors';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { DataStore } from './datastore';
import url from 'url';
import isArray from 'lodash/isArray';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */
export class UserStore extends DataStore {
  constructor() {
    super();
    this.disableCache();
  }

  /**
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */
  enableCache() {
    // Log a warning
    // throw new KinveyError('Unable to enable cache for the file store.');
  }

  /**
   * Make the store offline.
   *
   * @return {DataStore}  DataStore instance.
   */
  offline() {
    // Log a warning
    // throw new KinveyError('Unable to go offline for the file store.');
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  async create() {
    throw new KinveyError('Please use `User.signup()` to create a user.');
  }

  async update(user, options = {}) {
    if (!user) {
      throw new KinveyError('No user was provided to be updated.');
    }

    if (isArray(user)) {
      throw new KinveyError('Only one user can be updated at one time.', user);
    }

    if (!user[idAttribute]) {
      throw new KinveyError('User must have an _id.');
    }

    if (options._identity) {
      const socialIdentity = user[socialIdentityAttribute];
      if (socialIdentity) {
        for (const [key] of socialIdentity) {
          if (socialIdentity[key] && options._identity !== key) {
            delete socialIdentity[key];
          }
        }
      }
    }

    return super.update(user, options);
  }

  async exists(username, options) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${rpcNamespace}/${this.client.appKey}/check-username-exists`
      }),
      properties: options.properties,
      data: { username: username },
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    const response = await request.execute();
    const data = response.data || {};
    return !!data.usernameExists;
  }

  async restore(id, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.Master,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${id}`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    const response = await request.execute();
    return response.data;
  }
}

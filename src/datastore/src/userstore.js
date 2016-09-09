import { AuthType, RequestMethod, KinveyRequest } from '../../request';
import { KinveyError } from '../../errors';
import { NetworkStore } from './networkstore';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import isArray from 'lodash/isArray';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */
export class UserStore extends NetworkStore {
  constructor(options) {
    super(null, options);
  }

  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  /**
   * @private
   * @throws {KinveyError} Method is unsupported. Instead use User.signup() to create a user.
   */
  async create() {
    throw new KinveyError('Please use `User.signup()` to create a user.');
  }

  /**
   * Update a user.
   *
   * @deprecated Use the `update` function for a user instance.
   *
   * @param {Object} data Data for user to update.
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The updated user data.
   */
  async update(data, options = {}) {
    if (!data) {
      throw new KinveyError('No user was provided to be updated.');
    }

    if (isArray(data)) {
      throw new KinveyError('Only one user can be updated at one time.', data);
    }

    if (!data[idAttribute]) {
      throw new KinveyError('User must have an _id.');
    }

    return super.update(data, options);
  }

  /**
   * Check if a username already exists.
   *
   * @deprecated Use the `exists` function on the `User` class.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {boolean} True if the username already exists otherwise false.
   */
  async exists(username, options = {}) {
    const request = new KinveyRequest({
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
    const response = await request.execute();
    const data = response.data || {};
    return data.usernameExists === true;
  }

  /**
   * Restore a user that has been suspended.
   *
   * @deprecated Use the `restore` function on the `User` class.
   *
   * @param {string} id Id of the user to restore.
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  async restore(id, options = {}) {
    const request = new KinveyRequest({
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
    const response = await request.execute();
    return response.data;
  }
}

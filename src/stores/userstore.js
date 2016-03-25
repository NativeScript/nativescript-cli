import Promise from '../utils/promise';
import { KinveyError } from '../errors';
import { NetworkStore } from './networkstore';
import { AuthType, HttpMethod } from '../enums';
import { NetworkRequest } from '../requests/network';
import url from 'url';
import isArray from 'lodash/isArray';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';

export class UserStore extends NetworkStore {
  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get _pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  save(user, options = {}) {
    const promise = Promise.resolve().then(() => {
      if (!user) {
        throw new KinveyError('No user was provided to be updated.');
      }

      if (isArray(user)) {
        throw new KinveyError('Please only update one user at a time.', user);
      }

      if (!user[idAttribute]) {
        throw new KinveyError('User must have an _id.');
      }

      if (options._identity) {
        const socialIdentity = user[socialIdentityAttribute];
        if (socialIdentity) {
          for (const identity in socialIdentity) {
            if (socialIdentity.hasOwnProperty(identity)) {
              if (socialIdentity[identity] && options._identity !== identity) {
                delete socialIdentity[identity];
              }
            }
          }
        }
      }

      return super.save(user, options);
    });

    return promise;
  }

  exists(username, options) {
    const request = new NetworkRequest({
      method: HttpMethod.POST,
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

    const promise = request.execute().then(response => {
      return response.data.usernameExists;
    });

    return promise;
  }

  restore(id, options = {}) {
    const request = new NetworkRequest({
      method: HttpMethod.POST,
      authType: AuthType.Master,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this._pathname}/id`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    const promise = request.execute().then(response => {
      return response.data;
    });

    return promise;
  }
}

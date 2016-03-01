import NetworkStore from './networkStore';
import { HttpMethod } from '../enums';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

export class UsersStore extends NetworkStore {
  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get _pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  exists(username, options) {
    return this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${rpcNamespace}/${this.client.appKey}/check-username-exists`,
      properties: options.properties,
      auth: this.client.appAuth(),
      data: { username: username },
      timeout: options.timeout
    }).then(response => {
      return response.data.usernameExists;
    });
  }

  restore(id, options = {}) {
    const promise = Promise.resolve().then(() => {
      return this.client.executeNetworkRequest({
        method: HttpMethod.POST,
        pathname: `${this._pathname}/id`,
        properties: options.properties,
        auth: this.client.masterAuth(),
        timeout: options.timeout
      });
    }).then(response => {
      return response.data;
    });

    return promise;
  }
}

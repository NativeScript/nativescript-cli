import { Client } from '../src/client';
import { User as CoreUser } from '../src/user';
import { InvalidCredentialsError } from '../src/errors';
import { HttpMethod } from '../src/enums';
import assign from 'lodash/assign';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

export class Kinvey {
  static getActiveUser() {
    return CoreUser.getActiveUser();
  }

  static setActiveUser(user) {
    return CoreUser.setActiveUser(user);
  }

  static init(options = {}) {
    options = assign({
      refresh: true
    }, options);

    return Promise.resolve().then(() => {
      return Client.init(options);
    }).then(() => {
      return Kinvey.getActiveUser();
    }).then(user => {
      if (!user) {
        return Kinvey.setActiveUser(null);
      }

      if (options.refresh === false) {
        return user;
      }

      return user.me();
    }).catch(error => {
      if (error instanceof InvalidCredentialsError) {
        return Kinvey.setActiveUser(null);
      }

      throw error;
    });
  }

  /**
   * Pings the Kinvey service.
   *
   * @returns {Promise} The response.
   */
  static ping() {
    const client = Client.sharedInstance();
    return client.executeNetworkRequest({
      method: HttpMethod.GET,
      auth: client.allAuth(),
      pathname: `${appdataNamespace}/${client.appKey}`
    }).then(response => {
      return response.data;
    });
  }
}

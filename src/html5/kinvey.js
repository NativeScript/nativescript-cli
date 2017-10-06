import { Promise } from 'es6-promise';
import url from 'url';
import {
  Kinvey as CoreKinvey,
  isDefined,
  KinveyError,
  CacheRequest,
  RequestMethod,
  User
} from 'kinvey-js-sdk/dist/export';
import { Client } from './client';

const USERS_NAMESPACE = 'user';
const ACTIVE_USER_COLLECTION_NAME = 'kinvey_active_user';

export class Kinvey extends CoreKinvey {
  static initialize(config) {
    const client = Kinvey.init(config);
    const activeUser = User.getActiveUser(client);

    if (isDefined(activeUser)) {
      return Promise.resolve(activeUser);
    }

    const request = new CacheRequest({
      method: RequestMethod.GET,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/${USERS_NAMESPACE}/${client.appKey}/${ACTIVE_USER_COLLECTION_NAME}`
      })
    });
    return request.execute()
      .then(response => response.data)
      .then((activeUsers) => {
        if (activeUsers.length > 0) {
          return activeUsers[0];
        }

        return null;
      })
      .then((activeUser) => {
        if (isDefined(activeUser)) {
          if (isDefined(activeUser.data)) {
            return client.setActiveUser(activeUser.data);
          }

          return client.setActiveUser(activeUser);
        }

        return activeUser;
      })
      .then(() => User.getActiveUser(client));
  }

  static init(options = {}) {
    if (!isDefined(options.appKey)) {
      throw new KinveyError('No App Key was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    if (!isDefined(options.appSecret) && !isDefined(options.masterSecret)) {
      throw new KinveyError('No App Secret or Master Secret was provided.'
        + ' Unable to create a new Client without an App Secret.');
    }

    return Client.init(options);
  }
}

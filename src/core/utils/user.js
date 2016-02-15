import LocalRequest from '../requests/LocalRequest';
import Client from '../client';
import { HttpMethod } from '../enums';
import { NotFoundError } from '../errors';
import result from 'lodash/result';
const activeUserSymbol = Symbol();
const localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
const activeUserCollection = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';

/**
 * @private
 */
export default class UserUtils {
  static getActive(client = Client.sharedInstance()) {
    let user = UserUtils[activeUserSymbol][client.appKey];

    if (user) {
      return Promise.resolve(user);
    }

    const request = new LocalRequest({
      method: HttpMethod.GET,
      url: client.getUrl(`/${localNamespace}/${client.appKey}/${activeUserCollection}`)
    });
    const promise = request.execute().then(response => {
      const data = response.data;

      if (data.length === 0) {
        return null;
      }

      user = data[0];
      UserUtils[activeUserSymbol][client.appKey] = user;
      return user;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return null;
      }

      throw err;
    });

    return promise;
  }

  static setActive(user, client = Client.sharedInstance()) {
    const promise = UserUtils.getActive(client).then(activeUser => {
      if (activeUser) {
        const request = new LocalRequest({
          method: HttpMethod.DELETE,
          url: client.getUrl(`/${localNamespace}/${client.appKey}/${activeUserCollection}/${activeUser._id}`)
        });
        return request.execute().then(() => {
          UserUtils[activeUserSymbol][client.appKey] = null;
        });
      }
    }).then(() => {
      if (user) {
        const request = new LocalRequest({
          method: HttpMethod.POST,
          url: client.getUrl(`/${localNamespace}/${client.appKey}/${activeUserCollection}`),
          data: result(user, 'toJSON', user)
        });
        return request.execute();
      }
    }).then(response => {
      if (response && response.isSuccess()) {
        user = response.data;
        UserUtils[activeUserSymbol][client.appKey] = user;
        return user;
      }
    });

    return promise;
  }
}

UserUtils[activeUserSymbol] = {};

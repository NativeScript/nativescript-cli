import LocalRequest from '../requests/LocalRequest';
import Client from '../client';
import { HttpMethod } from '../enums';
import { NotFoundError } from '../errors';
import result from 'lodash/object/result';
import assign from 'lodash/object/assign';
const activeUserSymbol = Symbol();
const localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
const activeUserCollection = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';

/**
 * @private
 */
export default class UserUtils {
  static getActive(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    let user = UserUtils[activeUserSymbol][options.client.appId];

    if (user) {
      return Promise.resolve(user);
    }

    const request = new LocalRequest({
      method: HttpMethod.GET,
      pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}`,
      client: options.client
    });
    const promise = request.execute().then(response => {
      const data = response.data;

      if (data.length === 0) {
        return null;
      }

      user = data[0];
      UserUtils[activeUserSymbol][options.client.appId] = user;
      return user;
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return null;
      }

      throw err;
    });

    return promise;
  }

  static setActive(user, options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    const promise = UserUtils.getActive(options).then(activeUser => {
      if (activeUser) {
        const request = new LocalRequest({
          method: HttpMethod.DELETE,
          pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}/${activeUser._id}`,
          client: options.client
        });
        return request.execute().then(() => {
          UserUtils[activeUserSymbol][options.client.appId] = null;
        });
      }
    }).then(() => {
      if (user) {
        const request = new LocalRequest({
          method: HttpMethod.POST,
          pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}`,
          client: options.client,
          data: result(user, 'toJSON', user)
        });
        return request.execute();
      }
    }).then(response => {
      if (response && response.isSuccess()) {
        user = response.data;
        UserUtils[activeUserSymbol][options.client.appId] = user;
        return user;
      }
    });

    return promise;
  }
}

UserUtils[activeUserSymbol] = {};

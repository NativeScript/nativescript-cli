const Promise = require('bluebird');
const Request = require('../request').Request;
const Client = require('../client');
const DataPolicy = require('../enums').DataPolicy;
const HttpMethod = require('../enums').HttpMethod;
const NotFoundError = require('../errors').NotFoundError;
const result = require('lodash/object/result');
const assign = require('lodash/object/assign');
const activeUserSymbol = Symbol();
const localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
const activeUserCollection = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';

class UserUtils {
  static getActive(options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    let user = UserUtils[activeUserSymbol][options.client.appId];

    if (user) {
      return Promise.resolve(user);
    }

    const request = new Request({
      method: HttpMethod.GET,
      pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}`,
      client: options.client,
      dataPolicy: DataPolicy.LocalOnly
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
        const request = new Request({
          method: HttpMethod.DELETE,
          pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}/${activeUser._id}`,
          client: options.client,
          dataPolicy: DataPolicy.LocalOnly,
          skipSync: true
        });
        return request.execute().then(() => {
          UserUtils[activeUserSymbol][options.client.appId] = null;
        });
      }
    }).then(() => {
      if (user) {
        const request = new Request({
          method: HttpMethod.POST,
          pathname: `/${localNamespace}/${options.client.appId}/${activeUserCollection}`,
          client: options.client,
          dataPolicy: DataPolicy.LocalOnly,
          data: result(user, 'toJSON', user),
          skipSync: true
        });
        return request.execute();
      }
    }).then(response => {
      if (response) {
        user = response.data;
        UserUtils[activeUserSymbol][options.client.appId] = user;
        return user;
      }
    });

    return promise;
  }
}

UserUtils[activeUserSymbol] = {};
module.exports = UserUtils;

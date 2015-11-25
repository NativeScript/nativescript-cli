const Promise = require('bluebird');
const Request = require('../request').Request;
const Client = require('../client');
const DataPolicy = require('../enums').DataPolicy;
const HttpMethod = require('../enums').HttpMethod;
const result = require('lodash/object/result');
const activeUserSymbol = Symbol();
const localNamespace = process.env.KINVEY_LOCAL_NAMESPACE || 'local';
const activeUserCollection = process.env.KINVEY_ACTIVE_USER_COLLECTION || 'activeUser';

class UserUtils {
  static getActive(client = Client.sharedInstance()) {
    let user = UserUtils[activeUserSymbol];

    if (user) {
      return Promise.resolve(user);
    }

    const request = new Request({
      method: HttpMethod.GET,
      path: `/${localNamespace}/${client.appId}/${activeUserCollection}`,
      client: client,
      dataPolicy: DataPolicy.LocalOnly
    });

    const promise = request.execute().then(response => {
      const data = response.data;

      if (data.length === 0) {
        return null;
      }

      user = data[0];
      UserUtils[activeUserSymbol] = user;
      return user;
    }).catch(() => {
      return null;
    });

    return promise;
  }

  static setActive(user, client = Client.sharedInstance()) {
    const promise = UserUtils.getActive().then(activeUser => {
      if (activeUser) {
        const request = new Request({
          method: HttpMethod.DELETE,
          path: `/${localNamespace}/${client.appId}/${activeUserCollection}/${activeUser._id}`,
          client: client,
          dataPolicy: DataPolicy.LocalOnly,
          skipSync: true
        });
        return request.execute();
      }
    }).then(() => {
      if (user) {
        const request = new Request({
          method: HttpMethod.POST,
          path: `/${localNamespace}/${client.appId}/${activeUserCollection}`,
          client: client,
          dataPolicy: DataPolicy.LocalOnly,
          data: result(user, 'toJSON', user),
          skipSync: true
        });
        return request.execute();
      }
    }).then(response => {
      if (response) {
        user = response.data;
        UserUtils[activeUserSymbol] = user;
        return user;
      }
    });

    return promise;
  }
}

module.exports = UserUtils;

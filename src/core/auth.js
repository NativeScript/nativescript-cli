import UserUtils from './utils/user';

export default class Auth {
  static all(client) {
    return Auth.session(client).catch(() => {
      return Auth.basic(client);
    });
  }

  static app(client) {
    if (!client.appId || !client.appSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appId,
      password: client.appSecret
    });

    return promise;
  }

  static basic(client) {
    return Auth.master(client).catch(() => {
      return Auth.app(client);
    });
  }

  static default(client) {
    return Auth.session().catch((err) => {
      return Auth.master(client).catch(() => {
        return Promise.reject(err);
      });
    });
  }

  static master(client) {
    if (!client.appId || !client.masterSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appId,
      password: client.masterSecret
    });

    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
    return UserUtils.getActive().then(user => {
      if (!user) {
        throw new Error('There is not an active user.');
      }

      return {
        scheme: 'Kinvey',
        credentials: user._kmd.authtoken
      };
    });
  }
}

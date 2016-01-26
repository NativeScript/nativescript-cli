import UserUtils from './utils/user';

const Auth = {
  all(client) {
    return Auth.session(client).catch(() => {
      return Auth.basic(client);
    });
  },

  app(client) {
    if (!client.appKey || !client.appSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });

    return promise;
  },

  basic(client) {
    return Auth.master(client).catch(() => {
      return Auth.app(client);
    });
  },

  default(client) {
    return Auth.session().catch((err) => {
      return Auth.master(client).catch(() => {
        return Promise.reject(err);
      });
    });
  },

  master(client) {
    if (!client.appKey || !client.masterSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });

    return promise;
  },

  none() {
    return Promise.resolve(null);
  },

  session() {
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
};
export default Auth;

import { getActiveUser } from '../utils/user';

class Auth {
  static all(client) {
    return Auth.session(client).then(null, () => {
      return Auth.basic(client);
    });
  }

  static app(client) {
    // Validate preconditions.
    if (!client.appKey || !client.appSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });

    // Return the response.
    return promise;
  }

  static basic(client) {
    return Auth.master(client).then(null, () => {
      return Auth.app(client);
    });
  }

  static default(client) {
    return Auth.session(client).then(null).catch((err) => {
      return Auth.master(client).then(null).catch(() => {
        // Most likely, the developer did not create a user. Return a useful error.
        return Promise.reject(err);
      });
    });
  }

  static master(client) {
    // Validate preconditions.
    if (!client.appKey || !client.masterSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });

    // Return the response.
    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
    return getActiveUser().then(user => {
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

export default Auth;

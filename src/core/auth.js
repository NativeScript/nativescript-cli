const User = require('./models/user');

class Auth {
  static all(client) {
    return Auth.session(client).catch(() => {
      return Auth.basic(client);
    });
  }

  static app(client) {
    // Validate preconditions.
    if (!client.appId || !client.appSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appId,
      password: client.appSecret
    });

    // Return the response.
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
        // Most likely, the developer did not create a user. Return a useful error.
        return Promise.reject(err);
      });
    });
  }

  static master(client) {
    // Validate preconditions.
    if (!client.appId || !client.masterSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appId,
      password: client.masterSecret
    });

    // Return the response.
    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
    return User.getActive().then(user => {
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

module.exports = Auth;

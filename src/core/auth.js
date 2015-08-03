import User from './user';
import isDefined from '../utils/isDefined';

class Auth {
  static all(client) {
    return Auth.session(client).then(null, () => {
      return Auth.basic(client);
    });
  }

  static app(client) {
    // Validate preconditions.
    if (!isDefined(client.appKey) || !isDefined(client.appSecret)) {
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
    return Auth.session(client).then(null).catch((error) => {
      return Auth.master(client).then(null).catch(() => {
        // Most likely, the developer did not create a user. Return a useful error.
        return Promise.resolve(error);
      });
    });
  }

  static master(client) {
    // Validate preconditions.
    if (!isDefined(client.appKey) || !isDefined(client.masterSecret)) {
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
    const user = User.getActive();
    let error;

    if (!isDefined(user)) {
      error = new Error('There is not an active user.');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Kinvey',
      credentials: user.authtoken
    });

    // Return the response.
    return promise;
  }
}

export default Auth;

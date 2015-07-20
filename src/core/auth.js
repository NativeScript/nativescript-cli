import CoreObject from './object';
import User from './user';
import {isDefined} from '../utils';
import Kinvey from '../kinvey';

class Auth extends CoreObject {
  static all() {
    return Auth.session().then(null, Auth.Basic);
  }

  static app() {
    // Validate preconditions.
    if (!isDefined(Kinvey.appKey) || !isDefined(Kinvey.appSecret)) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: Kinvey.appKey,
      password: Kinvey.appSecret
    });

    // Return the response.
    return promise;
  }

  static basic() {
    return Auth.master().then(null, Auth.App);
  }

  static default() {
    return Auth.session().then(null).catch((error) => {
      return Auth.master().then(null).catch(() => {
        // Most likely, the developer did not create a user. Return a useful error.
        return Promise.resolve(error);
      });
    });
  }

  static master() {
    // Validate preconditions.
    if (!isDefined(Kinvey.appKey) || !isDefined(Kinvey.masterSecret)) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: Kinvey.appKey,
      password: Kinvey.masterSecret
    });

    // Return the response.
    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
    const user = User.current;
    let error;

    if (!isDefined(user)) {
      error = new Error('There is not an active user.');
      return Promise.reject(error);
    }

    // Prepare the response.
    const promise = Promise.resolve({
      scheme: 'kinvey',
      credentials: user.authToken
    });

    // Return the response.
    return promise;
  }
}

export default Auth;

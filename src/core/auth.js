import CoreObject from './object';
import User from './user';
import utils from './utils';
import Kinvey from '../kinvey';

class Auth extends CoreObject {
  static all() {
    return Auth.session().then(null, Auth.Basic);
  }

  static app() {
    let kinvey = Kinvey.instance();

    // Validate preconditions.
    if (!utils.isDefined(kinvey.appKey) || !utils.isDefined(kinvey.appSecret)) {
      let error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
      scheme: 'Basic',
      username: kinvey.appKey,
      password: kinvey.appSecret
    });

    // Return the response.
    return promise;
  }

  static basic() {
    return Auth.master().then(null, Auth.App);
  }

  static default() {
    return Auth.session().then(null, function(error) {
      return Auth.master().then(null, function() {
        // Most likely, the developer did not create a user. Return a useful error.
        return Promise.resolve(error);
      });
    });
  }

  static master() {
    let kinvey = Kinvey.instance();

    // Validate preconditions.
    if (!utils.isDefined(kinvey.appKey) || !utils.isDefined(kinvey.masterSecret)) {
      let error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
      scheme: 'Basic',
      username: kinvey.appKey,
      password: kinvey.masterSecret
    });

    // Return the response.
    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
    let user = User.current;
    let error;

    if (!utils.isDefined(user)) {
      error = new Error('There is not an active user.');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
      scheme: 'kinvey',
      credentials: user.authToken
    });

    // Return the response.
    return promise;
  }
}

export default Auth;

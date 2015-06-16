import Kinvey from '../kinvey';
import CoreObject from './object';
import Utils from './utils';

class Auth extends CoreObject {
  static all() {
    return Auth.Session().then(null, Auth.Basic);
  }

  static app() {
    // Validate preconditions.
    if (!Utils.isDefined(Kinvey.appKey) || !Utils.isDefined(Kinvey.appSecret)) {
      let error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
      scheme: 'Basic',
      username: Kinvey.appKey,
      password: Kinvey.appSecret
    });

    // Return the response.
    return promise;
  }

  static basic() {
    return Auth.Master().then(null, Auth.App);
  }

  static default() {
    return Auth.Session().then(null, function(error) {
      return Auth.Master().then(null, function() {
        // Most likely, the developer did not create a user. Return a useful
        // error.
        return Promise.resolve(error);
      });
    });
  }

  static master() {
    // Validate preconditions.
    if (!Utils.isDefined(Kinvey.appKey) || !Utils.isDefined(Kinvey.masterSecret)) {
      let error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
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
    // Validate preconditions.
    let error;
    let user;

    if (!Utils.isDefined(user)) {
      error = new Error('User not defined');
      return Promise.reject(error);
    }

    // Prepare the response.
    let promise = Promise.resolve({
      scheme: 'Kinvey',
      credentials: user._kmd.authtoken
    });

    // Return the response.
    return promise;
  }
}

export default Auth;

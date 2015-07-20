import CoreObject from './object';
import User from './user';
<<<<<<< Updated upstream
import {isDefined} from './utils';
=======
import {isDefined} from '../utils';
>>>>>>> Stashed changes
import Kinvey from '../kinvey';

class Auth extends CoreObject {
  static all() {
    return Auth.session().then(null, Auth.Basic);
  }

  static app() {
<<<<<<< Updated upstream
    let kinvey = Kinvey.instance();

    // Validate preconditions.
    if (!isDefined(kinvey.appKey) || !isDefined(kinvey.appSecret)) {
      let error = new Error('Missing client credentials');
=======
    // Validate preconditions.
    if (!isDefined(Kinvey.appKey) || !isDefined(Kinvey.appSecret)) {
      const error = new Error('Missing client credentials');
>>>>>>> Stashed changes
      return Promise.reject(error);
    }

    // Prepare the response.
<<<<<<< Updated upstream
    let promise = Promise.resolve({
      scheme: 'Basic',
      username: kinvey.appKey,
      password: kinvey.appSecret
=======
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: Kinvey.appKey,
      password: Kinvey.appSecret
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    let kinvey = Kinvey.instance();

    // Validate preconditions.
    if (!isDefined(kinvey.appKey) || !isDefined(kinvey.masterSecret)) {
      let error = new Error('Missing client credentials');
=======
    // Validate preconditions.
    if (!isDefined(Kinvey.appKey) || !isDefined(Kinvey.masterSecret)) {
      const error = new Error('Missing client credentials');
>>>>>>> Stashed changes
      return Promise.reject(error);
    }

    // Prepare the response.
<<<<<<< Updated upstream
    let promise = Promise.resolve({
      scheme: 'Basic',
      username: kinvey.appKey,
      password: kinvey.masterSecret
=======
    const promise = Promise.resolve({
      scheme: 'Basic',
      username: Kinvey.appKey,
      password: Kinvey.masterSecret
>>>>>>> Stashed changes
    });

    // Return the response.
    return promise;
  }

  static none() {
    return Promise.resolve(null);
  }

  static session() {
<<<<<<< Updated upstream
    let user = User.current;
=======
    const user = User.current;
>>>>>>> Stashed changes
    let error;

    if (!isDefined(user)) {
      error = new Error('There is not an active user.');
      return Promise.reject(error);
    }

    // Prepare the response.
<<<<<<< Updated upstream
    let promise = Promise.resolve({
=======
    const promise = Promise.resolve({
>>>>>>> Stashed changes
      scheme: 'kinvey',
      credentials: user.authToken
    });

    // Return the response.
    return promise;
  }
}

export default Auth;

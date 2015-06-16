import HttpMethod from '../enums/httpMethod';
import Kinvey from '../kinvey';
import CoreObject from './object';
// import Persistence from './persistence';
import Auth from './auth';
import CachePolicy from '../enums/cachePolicy';
import Utils from './utils';
import Request from './request';
// import Logger from './logger';
const currentUser = Symbol();

class User extends CoreObject {
  // static signup(data, options = {}) {
  //   // Mark the created user as the active user
  //   options.state = true;

  //   // Forward to `User.create`.
  //   return User.create(data, options);
  // }

  // static signupWithProvider(provider, tokens, options = {}) {
  //   // Parse tokens.
  //   let data = {_socialIdentity: {}};
  //   data._socialIdentity[provider] = tokens;

  //   // Forward to `User.signup`.
  //   return User.signup(data, options);
  // }

  // static create(data, options= {}) {
  //   User.getActiveUser()
  //   if (options.state !== false && Utils.) {
  //     var error = clientError(Kinvey.Error.ALREADY_LOGGED_IN);
  //     return wrapCallbacks(Kinvey.Defer.reject(error), options);
  //   }

  //   // Create the new user.
  //   var promise = Kinvey.Persistence.create({
  //     namespace : USERS,
  //     data      : data || {},
  //     auth      : Auth.App
  //   }, options).then(function(user) {
  //     // If `options.state`, set the active user.
  //     if(false !== options.state) {
  //       Kinvey.setActiveUser(user);
  //     }
  //     return user;
  //   });

  //   // Debug.
  //   if(KINVEY_DEBUG) {
  //     promise.then(function(response) {
  //       log('Created the new user.', response);
  //     }, function(error) {
  //       log('Failed to create the new user.', error);
  //     });
  //   }

  //   // Return the response.
  //   return wrapCallbacks(promise, options);
  // },

  static login(username, password) {
    // Reject if a user is already active
    // TODO...
    // Create the request
    let request = new Request(HttpMethod.POST, `/user/${Kinvey.appKey}/login`, null, {
        username: username,
        password: password
    });
    request.auth = Auth.app;

    // Check the cache
    request.getCachedResponse().then(() => {
      // Do something with the cached response
    }).catch(() => {
      // Did not find a cached response so execute the request on the rack
      return request.execute();
    }).then(() => {
      // Received a response from the network so lets cache it
      return request.cacheResponse();
    });

    // Execute the request
    return request.execute(true).then((response) => {
      // Get the user from the response
      let user = response.data;

      // Return the user
      return user;
    });
  }

  static current() {
    let user = this[currentUser];

    if (!Utils.isDefined(user)) {
      user = null;
    }

    return user;
  }
}

export default User;

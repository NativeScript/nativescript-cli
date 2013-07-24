/**
 * Copyright 2013 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Authentication.
// ---------------

// Access to the Kinvey service is authenticated through (implicit) user
// credentials, Master Secret, or App Secret. A combination of these is often
// accepted, but not always. Therefore, an extensive set of all possible
// combinations is gathered here and presented as authentication policies.

// The promise to handle concurrent requests when the active user is `null`.
var implicitUserPromise = null;

/**
 * @private
 * @namespace Auth
 */
var Auth = /** @lends Auth */{

  // All policies must return a {Promise}. The value of a resolved promise must
  // be an object containing `scheme` and `username` and `password` or
  // `credentials`. The reason of rejection must be a `Kinvey.Error` constant.

  // https://tools.ietf.org/html/rfc2617

  /**
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Promise}
   */
  All: function() {
    return Auth.Session().then(null, Auth.Basic);
  },

  /**
   * Authenticate through App Secret.
   *
   * @returns {Promise}
   */
  App: function() {
    // Validate preconditions.
    if(null == Kinvey.appKey || null == Kinvey.appSecret) {
      var error = clientError(Kinvey.Error.MISSING_APP_CREDENTIALS);
      return Kinvey.Defer.reject(error);
    }

    // Prepare the response.
    var promise = Kinvey.Defer.resolve({
      scheme   : 'Basic',
      username : Kinvey.appKey,
      password : Kinvey.appSecret
    });

    // Debug
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Authenticating through App Secret.', response);
      });
    }

    // Return the response.
    return promise;
  },

  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Promise}
   */
  Basic: function() {
    return Auth.Master().then(null, Auth.App);
  },

  /**
   * Authenticate through (1) user credentials, or (2) Master Secret. If both
   * fail, an implicit user is created and (1) is attempted.
   *
   * @returns {Promise}
   */
  Default: function() {
    return Auth.UserDefault().then(null, function() {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Creating an implicit user.');
      }

      // A race condition occurs when the active user is `null`, and multiple
      // requests are fired simultaneously. Normally, this would result in the
      // creation of multiple implicit users. The flow below ensures only one
      // implicit user can be created at the time, deferring any concurrent
      // requests until after the implicit user is created and ready for usage.

      // Debug.
      if(KINVEY_DEBUG && null !== implicitUserPromise) {
        log('An implicit user is already being created by another process, waiting.');
      }

      // If there is no implicit user being created right now, obtain the lock.
      if(null === implicitUserPromise) {
        // Create an implicit user.
        implicitUserPromise = Kinvey.User.create().then(function(user) {
          // Debug.
          if(KINVEY_DEBUG) {
            log('Created the implicit user.', user);
          }

          // Release the lock and return the response.
          implicitUserPromise = null;
          return user;
        }, function(error) {
          // Release the lock and forward the error.
          implicitUserPromise = null;
          return Kinvey.Defer.reject(error);
        });
      }

      // Authenticate using the implicit user.
      return implicitUserPromise.then(Auth.Session);
    });
  },

  /**
   * Authenticate through Master Secret.
   *
   * @returns {Promise}
   */
  Master: function() {
    // Validate preconditions.
    if(null == Kinvey.appKey || null == Kinvey.masterSecret) {
      var error = clientError(Kinvey.Error.MISSING_MASTER_CREDENTIALS);
      return Kinvey.Defer.reject(error);
    }

    // Prepare the response.
    var promise = Kinvey.Defer.resolve({
      scheme   : 'Basic',
      username : Kinvey.appKey,
      password : Kinvey.masterSecret
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Authenticating through Master Secret.', response);
      });
    }

    // Return the response.
    return promise;
  },

  /**
   * Do not authenticate.
   *
   * @returns {Promise}
   */
  None: function() {
    return Kinvey.Defer.resolve(null);
  },

  /**
   * Authenticate through user credentials.
   *
   * @returns {Promise}
   */
  Session: function() {
    // Validate preconditions.
    var user = Kinvey.getActiveUser();
    if(null === user) {
      var error = clientError(Kinvey.Error.NO_ACTIVE_USER);
      return Kinvey.Defer.reject(error);
    }

    // Prepare the response.
    var promise = Kinvey.Defer.resolve({
      scheme      : 'Kinvey',
      credentials : user._kmd.authtoken
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Authenticating through user credentials.', response);
      });
    }

    // Return the response.
    return promise;
  },

  /**
   * Authenticate through (1) user credentials, or (2) Master Secret.
   *
   * @returns {Promise}
   */
  UserDefault: function() {
    return Auth.Session().then(null, Auth.Master);
  }
};
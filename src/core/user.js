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

// Users.
// ------

// REST API wrapper for user management with the Kinvey services. Note the
// [active user](http://devcenter.kinvey.com/guides/users#ActiveUser) is not
// exclusively managed in this namespace: `Kinvey.getActiveUser` and
// `Kinvey.Auth.Session` operate on the active user as well.

/**
 * @memberof! <global>
 * @namespace Kinvey.User
 */
Kinvey.User = /** @lends Kinvey.User */{
  /**
   * Signs up a new user.
   *
   * @param {Object} [data] User data.
   * @param {Options} [options] Options.
   * @returns {Promise} The new user.
   */
  signup: function(data, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Signing up a new user.', arguments);
    }

    // Forward to `Kinvey.User.create`. Signup, however, always marks the
    // created user as the active user.
    options = options || {};
    options.state = true;// Overwrite.
    return Kinvey.User.create(data, options);
  },

  /**
   * Logs in an existing user.
   * NOTE If `options._provider`, this method should trigger a BL script.
   *
   * @param {Object|string} usernameOrData Username, or user data.
   * @param {string} [password] Password.
   * @param {Options} [options] Options.
   * @param {boolean} [options._provider] Login via Business Logic. May only
   *          be used internally to provide social login for browsers.
   * @returns {Promise} The active user.
   */
  login: function(usernameOrData, password, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Logging in an existing user.', arguments);
    }

    // Validate preconditions.
    if(null !== Kinvey.getActiveUser()) {
      var error = clientError(Kinvey.Error.ALREADY_LOGGED_IN);
      return Kinvey.Defer.reject(error);
    }

    // Cast arguments.
    if(isObject(usernameOrData)) {
      options = 'undefined' !== typeof options ? options : password;
    }
    else {
      usernameOrData = { username: usernameOrData, password: password };
    }
    options = options || {};

    // Validate arguments.
    if(null == usernameOrData.username && null == usernameOrData.password &&
     null == usernameOrData._socialIdentity) {
      throw new Kinvey.Error('Argument must contain: username and password, or _socialIdentity.');
    }

    // Login with the specified credentials.
    var promise = Kinvey.Persistence.create({
      namespace  : USERS,
      collection : options._provider ? null : 'login',
      data       : usernameOrData,
      flags      : options._provider ? { provider: options._provider } : {},
      auth       : Auth.App,
      local      : { res: true }
    }, options).then(function(user) {
      // Set and return the active user.
      Kinvey.setActiveUser(user);
      return user;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Logged in the user.', response);
      }, function(error) {
        log('Failed to login the user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Logs out the active user.
   *
   * @param {Options} [options] Options.
   * @param {boolean] [options.force=false] Reset the active user even if an
   *          `InvalidCredentials` error is returned.
   * @param {boolean} [options.silent=false] Succeed when there is no active
   *          user.
   * @returns {Promise} The previous active user.
   */
  logout: function(options) {
    // Cast arguments.
    options = options || {};

    // If `options.silent`, resolve immediately if there is no active user.
    var promise;
    if(options.silent && null === Kinvey.getActiveUser()) {
      promise = Kinvey.Defer.resolve(null);
    }
    else {// Otherwise, attempt to logout the active user.
      // Debug.
      if(KINVEY_DEBUG) {
        log('Logging out the active user.', arguments);
      }

      // Prepare the response.
      promise = Kinvey.Persistence.create({
        namespace  : USERS,
        collection : '_logout',
        auth       : Auth.Session
      }, options).then(null, function(error) {
        // If `options.force`, clear the active user on `INVALID_CREDENTIALS`.
        if(options.force && Kinvey.Error.INVALID_CREDENTIALS === error.name) {
          // Debug.
          if(KINVEY_DEBUG) {
            log('The user credentials are invalid. Returning success because of the force flag.');
          }
          return null;
        }
        return Kinvey.Defer.reject(error);
      }).then(function() {
        // Reset the active user, and return the previous active user. Make
        // sure to delete the authtoken.
        var previous = Kinvey.setActiveUser(null);
        if(null !== previous) {
          delete previous._kmd.authtoken;
        }
        return previous;
      });

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(response) {
          log('Logged out the active user.', response);
        }, function(error) {
          log('Failed to logout the active user.', error);
        });
      }
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Retrieves information on the active user.
   *
   * @param {Options} [options] Options.
   * @returns {Promise} The active user.
   */
  me: function(options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving information on the active user.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace  : USERS,
      collection : '_me',
      auth       : Auth.Session,
      local      : { req: true, res: true }
    }, options).then(function(user) {
      // The response is a fresh copy of the active user. However, the response
      // does not contain `_kmd.authtoken`. Therefore, extract it from the
      // stale copy.
      user._kmd = user._kmd || {};
      user._kmd.authtoken = Kinvey.getActiveUser()._kmd.authtoken;

      // Set and return the active user.
      Kinvey.setActiveUser(user);
      return user;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved information on the active user.', response);
      }, function(error) {
        log('Failed to retrieve information on the active user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Requests e-mail verification for a user.
   *
   * @param {string} username Username.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  verifyEmail: function(username, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Requesting e-mail verification.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace  : RPC,
      collection : username,
      id         : 'user-email-verification-initiate',
      auth       : Auth.App
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Requested e-mail verification.', response);
      }, function(error) {
        log('Failed to request e-mail verification.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Requests a username reminder for a user.
   *
   * @param {string} email E-mail.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  forgotUsername: function(email, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Requesting a username reminder.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace : RPC,
      id        : 'user-forgot-username',
      data      : { email: email },
      auth      : Auth.App
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Requested a username reminder.', response);
      }, function(error) {
        log('Failed to request a username reminder.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Requests a password reset for a user.
   *
   * @param {string} username Username.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  resetPassword: function(username, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Requesting a password reset.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace  : RPC,
      collection : username,
      id         : 'user-password-reset-initiate',
      auth       : Auth.App
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Requested a password reset.', response);
      }, function(error) {
        log('Failed to request a password reset.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Checks whether a username exists.
   *
   * @param {string} username Username to check.
   * @param {Options} [options] Options.
   * @returns {Promise} `true` if username exists, `false` otherwise.
   */
  exists: function(username, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Checking whether a username exists.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace : RPC,
      id        : 'check-username-exists',
      data      : { username: username },
      auth      : Auth.App
    }, options).then(function(response) {
      return response.usernameExists;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Checked whether the username exists.', response);
      }, function(error) {
        log('Failed to check whether the username exists.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Creates a new user.
   *
   * @param {Object} [data] User data.
   * @param {Options} [options] Options.
   * @param {boolean} [options.state=true] Save the created user as the active
   *          user.
   * @returns {Promise} The new user.
   */
  create: function(data, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Creating a new user.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // If `options.state`, validate preconditions.
    if(false !== options.state && null !== Kinvey.getActiveUser()) {
      var error = clientError(Kinvey.Error.ALREADY_LOGGED_IN);
      return Kinvey.Defer.reject(error);
    }

    // Create the new user.
    var promise = Kinvey.Persistence.create({
      namespace : USERS,
      data      : data || {},
      auth      : Auth.App
    }, options).then(function(user) {
      // If `options.state`, set the active user.
      if(false !== options.state) {
        Kinvey.setActiveUser(user);
      }
      return user;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Created the new user.', response);
      }, function(error) {
        log('Failed to create the new user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Updates a user. To create a user, use `Kinvey.User.create` or
   * `Kinvey.User.signup`.
   *
   * @param {Object} data User data.
   * @param {Options} [options] Options.
   * @param {string} [options._provider] Do not strip the `access_token` for
   *          this provider. Should only be used internally.
   * @throws {Kinvey.Error} `data` must contain: `_id`.
   * @returns {Promise} The user.
   */
  update: function(data, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Updating a user.', arguments);
    }

    // Validate arguments.
    if(null == data._id) {
      throw new Kinvey.Error('data argument must contain: _id');
    }

    // Cast arguments.
    options = options || {};

    // Delete the social identities’ access tokens, unless the identity is
    // `options._provider`. The tokens will be re-added after updating.
    var tokens = [];
    if(null != data._socialIdentity) {
      for(var identity in data._socialIdentity) {
        if(data._socialIdentity.hasOwnProperty(identity)) {
          if(null != data._socialIdentity[identity] && identity !== options._provider) {
            tokens.push({
              provider            : identity,
              access_token        : data._socialIdentity[identity].access_token,
              access_token_secret : data._socialIdentity[identity].access_token_secret
            });
            delete data._socialIdentity[identity].access_token;
            delete data._socialIdentity[identity].access_token_secret;
          }
        }
      }
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.update({
      namespace : USERS,
      id        : data._id,
      data      : data,
      auth      : Auth.Default,
      local     : { res: true }
    }, options).then(function(user) {
      // Re-add the social identities’ access tokens.
      tokens.forEach(function(identity) {
        var provider = identity.provider;
        if(null != user._socialIdentity && null != user._socialIdentity[provider]) {
          ['access_token', 'access_token_secret'].forEach(function(field) {
            if(null != identity[field]) {
              user._socialIdentity[provider][field] = identity[field];
            }
          });
        }
      });

      // If we just updated the active user, refresh it.
      var activeUser = Kinvey.getActiveUser();
      if(null !== activeUser && activeUser._id === user._id) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('Updating the active user because the updated user was the active user.');
        }

        Kinvey.setActiveUser(user);
      }
      return user;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Updated the user.', response);
      }, function(error) {
        log('Failed to update the user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Retrieves all users matching the provided query.
   *
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} [options] Options.
   * @param {boolean} [discover=false] Use
   *          [User Discovery](http://devcenter.kinvey.com/guides/users#lookup).
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} A list of users.
   */
  find: function(query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving users by query.', arguments);
    }

    // Validate arguments.
    if(null != query && !(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Cast arguments.
    options = options || {};

    // If `options.discover`, use
    // [User Discovery](http://devcenter.kinvey.com/guides/users#lookup)
    // instead of querying the user namespace directly.
    var promise;
    if(options.discover) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Using User Discovery because of the discover flag.');
      }

      // Prepare the response.
      promise = Kinvey.Persistence.create({
        namespace  : USERS,
        collection : '_lookup',
        data       : null != query ? query.toJSON().filter : null,
        auth       : Auth.Default,
        local      : { req: true, res: true }
      }, options);
    }
    else {
      // Prepare the response.
      promise = Kinvey.Persistence.read({
        namespace  : USERS,
        query      : query,
        auth       : Auth.Default,
        local      : { req: true, res: true }
      }, options);
    }

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved the users by query.', response);
      }, function(error) {
        log('Failed to retrieve the users by query.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Retrieves a user.
   *
   * @param {string} id User id.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  get: function(id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Retrieving a user.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace : USERS,
      id        : id,
      auth      : Auth.Default,
      local     : { req: true, res: true }
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Retrieved the user.', response);
      }, function(error) {
        log('Failed to return the user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Deletes a user.
   *
   * @param {string} id User id.
   * @param {Options} [options] Options.
   * @param {boolean} [options.hard=false] Perform a hard delete.
   * @param {boolean} [options.silent=false] Succeed if the user did not exist
   *          prior to deleting.
   * @returns {Promise} The response.
   */
  destroy: function(id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Deleting a user.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.destroy({
      namespace : USERS,
      id        : id,
      flags     : options.hard ? { hard: true } : {},
      auth      : Auth.Default,
      local     : { res: true }
    }, options).then(function(response) {
      // If we just deleted the active user, unset it here.
      var activeUser = Kinvey.getActiveUser();
      if(null !== activeUser && activeUser._id === id) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('Deleting the active user because the deleted user was the active user.');
        }

        Kinvey.setActiveUser(null);
      }
      return response;
    }, function(error) {
      // If `options.silent`, treat `USER_NOT_FOUND` as success.
      if(options.silent && Kinvey.Error.USER_NOT_FOUND === error.name) {
        // Debug.
        if(KINVEY_DEBUG) {
          log('The user does not exist. Returning success because of the silent flag.');
        }

        return null;
      }
      return Kinvey.Defer.reject(error);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Deleted the user.', response);
      }, function(error) {
        log('Failed to delete the user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Restores a previously disabled user.
   *
   * @param {string} id User id.
   * @param {Options} [options] Options.
   * @returns {Promise} The response.
   */
  restore: function(id, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Restoring a previously disabled user.', arguments);
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace  : USERS,
      collection : id,
      id         : '_restore',
      auth       : Auth.Master
    }, options);

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Restored the previously disabled user.', response);
      }, function(error) {
        log('Failed to restore the previously disabled user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Performs a count operation.
   *
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query`.
   * @returns {Promise} The response.
   */
  count: function(query, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Counting the number of users.', arguments);
    }

    // Validate arguments.
    if(null != query && !(query instanceof Kinvey.Query)) {
      throw new Kinvey.Error('query argument must be of type: Kinvey.Query.');
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.read({
      namespace : USERS,
      id        : '_count',
      query     : query,
      auth      : Auth.Default,
      local     : { req: true }
    }, options).then(function(response) {
      return response.count;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Counted the number of users.', response);
      }, function(error) {
        log('Failed to count the number of users.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Performs a group operation.
   *
   * @param {Kinvey.Aggregation} aggregation The aggregation.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `aggregation` must be of type `Kinvey.Group`.
   * @returns {Promise} The response.
   */
  group: function(aggregation, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Grouping users.', arguments);
    }

    // Validate arguments.
    if(!(aggregation instanceof Kinvey.Group)) {
      throw new Kinvey.Error('aggregation argument must be of type: Kinvey.Group.');
    }

    // Cast arguments.
    options = options || {};

    // Prepare the response.
    var promise = Kinvey.Persistence.create({
      namespace : USERS,
      id        : '_group',
      data      : aggregation.toJSON(),
      auth      : Auth.Default,
      local     : { req: true }
    }, options).then(function(response) {
      // Process the raw response.
      return aggregation.postProcess(response);
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Grouped the users.', response);
      }, function(error) {
        log('Failed to group the users.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  }
};
/**
 * Copyright 2014 Kinvey, Inc.
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

// Social Identities.
// ------------------

// An app can remove friction by not requiring users to create special
// usernames and passwords just for the app. Instead, the app can offer options
// for users to login using social identities. The flow of obtaining the tokens
// from the social party is defined below.

// List of supported providers.
var supportedProviders = [ 'facebook', 'google', 'linkedIn', 'twitter' ];

/**
 * @private
 * @namespace
 */
var Social = {
  /**
   * Sets the implementation of `Kinvey.Social` to the specified adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Kinvey.Social`
   *          interface.
   */
  use: use(supportedProviders)
};

// Add stubs for the provider methods.
supportedProviders.forEach(function(provider) {
  Social[provider] = methodNotImplemented('Social.' + provider);
});

/**
 * @memberof! <global>
 * @namespace Kinvey.Social
 */
Kinvey.Social = /** @lends Kinvey.Social */{
  /**
   * Links a social identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {string} provider The provider.
   * @param {Options} [options] Options.
   * @param {boolean} [options.create=true] Create a new user if no user with
   *          the provided social identity exists.
   * @throws {Kinvey.Error} `provider` is not supported.
   * @returns {Promise} The user.
   */
  connect: function(user, provider, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Linking a social identity to a Kinvey user.', arguments);
    }

    // Cast and validate arguments.
    options        = options || {};
    options.create = 'undefined' !== typeof options.create ? options.create : true;
    if(!Kinvey.Social.isSupported(provider)) {
      throw new Kinvey.Error('provider argument is not supported.');
    }

    // Remove callbacks from `options` to avoid multiple calls.
    var success = options.success;
    var error   = options.error;
    delete options.success;
    delete options.error;

    // Obtain the OAuth tokens for the specified provider.
    var promise = Social[provider](options).then(function(tokens) {
      // Update the user data.
      user = user || {};

      // If the user is the active user, forward to `Kinvey.User.update`.
      var activeUser = Kinvey.getActiveUser();
      user._socialIdentity           = user._socialIdentity || {};
      user._socialIdentity[provider] = tokens;

      if (null !== activeUser) {
        // Check activeUser for property _id. Thrown error will reject promise.
        if (activeUser._id == null) {
          error = new Kinvey.Error('Active user does not have _id property defined.');
          throw error;
        }

        if (activeUser._id === user._id) {
          options._provider = provider;// Force tokens to be updated.
          return Kinvey.User.update(user, options);
        }
      }

      // Attempt logging in with the tokens.
      user._socialIdentity           = {};
      user._socialIdentity[provider] = tokens;
      return Kinvey.User.login(user, null, options).then(null, function(error) {
        // If `options.create`, attempt to signup as a new user if no user with
        // the identity exists.
        if(options.create && Kinvey.Error.USER_NOT_FOUND === error.name) {
          return Kinvey.User.signup(user, options);
        }
        return Kinvey.Defer.reject(error);
      });
    });

    // Restore the options.
    promise = promise.then(function(response) {
      options.success = success;
      options.error   = error;
      return response;
    });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(response) {
        log('Linked the social identity to the Kinvey user.', response);
      }, function(error) {
        log('Failed to link a social identity to a Kinvey user.', error);
      });
    }

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Removes a social identity from the provided Kinvey user.
   *
   * @param {Object} [user] The user.
   * @param {string} provider The provider.
   * @param {Options} [options] Options.
   * @throws {Kinvey.Error} `provider` is not supported.
   * @returns {Promise} The user.
   */
  disconnect: function(user, provider, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Unlinking a social identity from a Kinvey user.', arguments);
    }

    // Cast and validate arguments.
    if(!Kinvey.Social.isSupported(provider)) {
      throw new Kinvey.Error('provider argument is not supported.');
    }

    // Update the user data.
    user._socialIdentity           = user._socialIdentity || {};
    user._socialIdentity[provider] = null;

    // If the user exists, forward to `Kinvey.User.update`. Otherwise, resolve
    // immediately.
    if(null == user._id) {
      var promise = Kinvey.Defer.resolve(user);
      return wrapCallbacks(promise, options);
    }
    return Kinvey.User.update(user, options);
  },

  /**
   * Links a Facebook identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  facebook: function(user, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Linking a Facebook identity to a Kinvey user.', arguments);
    }

    // Forward to `Kinvey.Social.connect`.
    return Kinvey.Social.connect(user, 'facebook', options);
  },

  /**
   * Links a Google+ identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  google: function(user, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Linking a Google+ identity to a Kinvey user.', arguments);
    }

    // Forward to `Kinvey.Social.connect`.
    return Kinvey.Social.connect(user, 'google', options);
  },

  /**
   * Returns whether a social provider is supported.
   *
   * @param {string} provider The provider.
   * @returns {boolean}
   */
  isSupported: function(provider) {
    return -1 !== supportedProviders.indexOf(provider);
  },

  /**
   * Links a LinkedIn identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  linkedIn: function(user, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Linking a LinkedIn identity to a Kinvey user.', arguments);
    }

    // Forward to `Kinvey.Social.connect`.
    return Kinvey.Social.connect(user, 'linkedIn', options);
  },

  /**
   * Links a Twitter identity to the provided (if any) Kinvey user.
   *
   * @param {Object} [user] The associated user.
   * @param {Options} [options] Options.
   * @returns {Promise} The user.
   */
  twitter: function(user, options) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Linking a Twitter identity to a Kinvey user.', arguments);
    }

    // Forward to `Kinvey.Social.connect`.
    return Kinvey.Social.connect(user, 'twitter', options);
  }
};

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

// Expose a `Kinvey.Backbone` user model and user collection mixin can be used
// to extend Backbone’s model and collection.

// Define the general user mixin. It preseeds the `url`.
/**
 * @private
 * @namespace UserMixin
 */
var UserMixin = /** @lends UserMixin */{
  /**
   * The models’ resource location.
   * See [Backbone.js](http://backbonejs.org/#Model-url).
   *
   * @default
   * @type {string}
   */
  url: USERS
};

// Define the user model and collection mixins.

/**
 * @memberof! <global>
 * @mixin Kinvey.Backbone.UserMixin
 * @mixes Kinvey.Backbone.ModelMixin
 * @borrows UserMixin.url as url
 */
Kinvey.Backbone.UserMixin = _.extend(
  {},
  Kinvey.Backbone.ModelMixin, UserMixin,
  /** @lends Kinvey.Backbone.UserMixin */{
    /**
     * Links a social identity to the user.
     *
     * @param {string} provider The provider.
     * @param {Object} [options] Options.
     * @returns {Promise} The model, response, and options objects.
     */
    connect: function(provider, options) {
      // Cast arguments.
      options         = options ? _.clone(options) : {};
      options.parse   = 'undefined' === typeof options.parse ? true : options.parse;
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options);

      // Return the response.
      var promise = Kinvey.Social.connect(this.attributes, provider, options);
      return kinveyToBackbonePromise(promise, options);
    },

    /**
     * Removes a social identity from the user.
     *
     * @param {string} provider The provider.
     * @param {Object} [options] Options.
     * @returns {Promise} The model, response, and options objects.
     */
    disconnect: function(provider, options) {
      // Cast arguments.
      options         = options ? _.clone(options) : {};
      options.parse   = 'undefined' === typeof options.parse ? true : options.parse;
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options);

      // Return the response.
      var promise = Kinvey.Social.disconnect(this.attributes, provider, options);
      return kinveyToBackbonePromise(promise, options);
    },

    /**
     * Returns the email verification status.
     *
     * @method
     * @returns {?Object} The email verification status, or `null` if not set.
     */
    getEmailVerification: backboneWrapMetadata(Kinvey.Metadata.prototype.getEmailVerification),

    /**
     * Returns whether the user is logged in.
     *
     * @returns {boolean}
     */
    isLoggedIn: function() {
      var user = Kinvey.getActiveUser();
      if(null !== user) {
        var kmd = this.get('_kmd');
        return null != kmd && kmd.authtoken === user._kmd.authtoken;
      }
      return false;
    },

    /**
     * Logs in an existing user.
     *
     * @param {Object|string} usernameOrData Username, or user data.
     * @param {string} [password] Password.
     * @param {Object} [options] Options.
     * @returns {Promise} The model, response, and options objects.
     */
    login: function(usernameOrData, password, options) {
      // Cast arguments.
      options         = _.clone(isObject(usernameOrData) ? password : options) || {};
      options.parse   = 'undefined' === typeof options.parse ? true : options.parse;
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options);

      // Return the response.
      var promise = Kinvey.User.login(usernameOrData, password, options);
      return kinveyToBackbonePromise(promise, options);
    },

    /**
     * Logs out the user.
     *
     * @param {Object} [options] Options.
     * @returns {Promise} The model, response, and options objects.
     */
    logout: function(options) {
      // Cast arguments.
      options         = options ? _.clone(options) : {};
      options.parse   = 'undefined' === typeof options.parse ? true : options.parse;
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options);

      // Validate preconditions.
      var promise;
      if(!this.isLoggedIn()) {
        var error = clientError(Kinvey.Error.NOT_LOGGED_IN);
        promise = Kinvey.Defer.reject(error);
        wrapCallbacks(promise, options);
      }
      else {
        promise = Kinvey.User.logout(options);
      }

      // Return the response.
      return kinveyToBackbonePromise(promise, options);
    },

    /**
     * Retrieves information on the user.
     *
     * @param {Options} [options] Options.
     * @returns {Promise} The model, response, and options objects.
     */
    me: function(options) {
      // Cast arguments.
      options         = options ? _.clone(options) : {};
      options.parse   = 'undefined' === typeof options.parse ? true : options.parse;
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options);

      // Validate preconditions.
      var promise;
      if(!this.isLoggedIn()) {
        var error = clientError(Kinvey.Error.NOT_LOGGED_IN);
        promise = Kinvey.Defer.reject(error);
        wrapCallbacks(promise, options);
      }
      else {
        promise = Kinvey.User.me(options);
      }

      // Return the response.
      return kinveyToBackbonePromise(promise, options);
    }
  }
);

/**
 * @memberof! <global>
 * @mixin Kinvey.Backbone.StaticUserMixin
 */
Kinvey.Backbone.StaticUserMixin = /** @lends Kinvey.Backbone.StaticUserMixin */{
  /**
   * Requests e-mail verification for a user.
   *
   * @param {string} username Username.
   * @param {Options} [options] Options.
   * @returns {Promise} The response, status, and xhr objects.
   */
  verifyEmail: function(username, options) {
    // Cast arguments.
    options = options || {};

    // Return the response.
    var promise = Kinvey.User.verifyEmail(username, options);
    return kinveyToBackbonePromise(promise, options);
  },

  /**
   * Requests a username reminder for a user.
   *
   * @param {string} email E-mail.
   * @param {Options} [options] Options.
   * @returns {Promise} The response, status, and xhr objects.
   */
  forgotUsername: function(email, options) {
    // Cast arguments.
    options = options || {};

    // Return the response.
    var promise = Kinvey.User.forgotUsername(email, options);
    return kinveyToBackbonePromise(promise, options);
  },

  /**
   * Requests a password reset for a user.
   *
   * @param {string} username Username.
   * @param {Options} [options] Options.
   * @returns {Promise} The response, status, and xhr objects.
   */
  resetPassword: function(username, options) {
    // Cast arguments.
    options = options || {};

    // Return the response.
    var promise = Kinvey.User.resetPassword(username, options);
    return kinveyToBackbonePromise(promise, options);
  },

  /**
   * Checks whether a username exists.
   *
   * @param {string} username Username to check.
   * @param {Options} [options] Options.
   * @returns {Promise} The response, status, and xhr objects.
   */
  exists: function(username, options) {
    // Cast arguments.
    options = options || {};

    // Return the response.
    var promise = Kinvey.User.exists(username, options);
    return kinveyToBackbonePromise(promise, options);
  },

  /**
   * Restores a previously disabled user.
   *
   * @param {string} id User id.
   * @param {Options} [options] Options.
   * @returns {Promise} The response, status, and xhr objects.
   */
  restore: function(id, options) {
    // Cast arguments.
    options = options || {};

    // Return the response.
    var promise = Kinvey.User.restore(id, options);
    return kinveyToBackbonePromise(promise, options);
  }
};

/**
 * @memberof! <global>
 * @mixin Kinvey.Backbone.UserCollectionMixin
 * @mixes Kinvey.Backbone.CollectionMixin
 * @borrows UserMixin.url as url
 */
Kinvey.Backbone.UserCollectionMixin = _.extend(
  _.omit(Kinvey.Backbone.CollectionMixin, 'clean'),// Users cannot be cleaned.
  UserMixin
);
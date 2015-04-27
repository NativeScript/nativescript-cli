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

// Constants.
// ----------

/**
 * The Kinvey server.
 *
 * @constant
 * @type {string}
 * @default
 * @deprecated Kinvey.API_ENDPOINT
 */
Kinvey.APIHostName = '<%= config.kcs.protocol %>://<%= config.kcs.host %>';
Kinvey.API_ENDPOINT = undefined;

/**
 * The Auth server.
 *
 * @constant
 * @type {String}
 * @default <%= config.auth.protocol %>://<%= config.auth.host %>
 */
Kinvey.MICHostName = '<%= config.auth.protocol %>://<%= config.auth.host %>';

/**
 * The Kinvey API version used when communicating with `Kinvey.APIHostName`.
 *
 * @constant
 * @type {string}
 * @default
 */
Kinvey.API_VERSION = '<%= config.apiVersion %>';

/**
 * The current version of the library.
 *
 * @constant
 * @type {string}
 * @default
 */
Kinvey.SDK_VERSION = '<%= pkg.version %>';

// Properties.
// -----------

/**
 * Kinvey App Key.
 *
 * @private
 * @type {?string}
 */
Kinvey.appKey = null;

/**
 * Kinvey App Secret.
 *
 * @private
 * @type {?string}
 */
Kinvey.appSecret = null;

/**
 * Kinvey Master Secret.
 *
 * @private
 * @type {?string}
 */
Kinvey.masterSecret = null;

// Top-level functionality.
// ------------------------

// The namespaces of the Kinvey service.
var DATA_STORE  = 'appdata';
var FILES       = 'blob';
/*var PUSH = 'push';*/
var RPC         = 'rpc';
var USERS       = 'user';
var CRP_MAX_BYTES = 2000;
/*var USER_GROUPS = 'group';*/

// The library has a concept of an active user which represents the person
// using the app. There can only be one user per copy of the library.

// The active user.
var activeUser = null;

// Status flag indicating whether the active user is ready to be used.
var activeUserReady = false;

/**
 * Restores the active user (if any) from disk.
 *
 * @param {Object} options Options.
 * @returns {Promise} The active user, or `null` if there is no active user.
 */
var restoreActiveUser = function(options) {
  // Retrieve the authtoken from storage. If there is an authtoken, restore the
  // active user from disk.
  var promise = Storage.get('activeUser');
  return promise.then(function(user) {
    // If there is no active user, set to `null`.
    if(null == user) {
      return Kinvey.setActiveUser(null);
    }

    // Debug.
    if(KINVEY_DEBUG) {
      log('Restoring the active user.');
    }

    // Set the active user to a near-empty user with only id and authtoken set.
    var previous = Kinvey.setActiveUser({ _id: user[0], _kmd: { authtoken: user[1] } });

    // If not `options.refresh`, return here.
    if(false === options.refresh) {
      return Kinvey.getActiveUser();
    }

    // Remove callbacks from `options` to avoid multiple calls.
    var fnSuccess = options.success;
    var fnError   = options.error;
    delete options.success;
    delete options.error;

    // Retrieve the user. The `Kinvey.User.me` method will also update the
    // active user. If `INVALID_CREDENTIALS`, reset the active user.
    return Kinvey.User.me(options).then(function(response) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Restored the active user.', response);
      }

      // Restore the options and return the response.
      options.success = fnSuccess;
      options.error   = fnError;
      return response;
    }, function(error) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to restore the active user.', error);
      }

      // Reset the active user.
      if(Kinvey.Error.INVALID_CREDENTIALS === error.name) {
        Kinvey.setActiveUser(previous);
      }

      // Restore the options and return the response.
      options.success = fnSuccess;
      options.error   = fnError;
      return Kinvey.Defer.reject(error);
    });
  });
};

/**
 * Returns the active user.
 *
 * @throws {Error} `Kinvey.getActiveUser` can only be called after the promise
     returned by `Kinvey.init` fulfills or rejects.
 * @returns {?Object} The active user, or `null` if there is no active user.
 */
Kinvey.getActiveUser = function() {
  // Validate preconditions.
  if(false === activeUserReady) {
    throw new Kinvey.Error('Kinvey.getActiveUser can only be called after the ' +
     'promise returned by Kinvey.init fulfills or rejects.');
  }

  return activeUser;
};

/**
 * Sets the active user.
 *
 * @param {?Object} user The active user, or `null` to reset.
 * @throws {Kinvey.Error} `user` must contain: `_kmd.authtoken`.
 * @returns {?Object} The previous active user, or `null` if there was no
 *            previous active user.
 * @throws {Kinvey.Error} user argument must contain: _id, _kmd.authtoken.
 */
Kinvey.setActiveUser = function(user) {
  // Debug.
  if(KINVEY_DEBUG) {
    log('Setting the active user.', arguments);
  }

  // Validate arguments.
  if(null != user && !(null != user._id && null != user._kmd && null != user._kmd.authtoken)) {
    throw new Kinvey.Error('user argument must contain: _id, _kmd.authtoken.');
  }

  // At this point, the active user is ready to be used (even though the
  // user data is not retrieved yet).
  if(false === activeUserReady) {
    activeUserReady = true;
  }

  var result = Kinvey.getActiveUser();// Previous.
  activeUser = user;

  // Update disk state in the background.
  if(null != user) {// Save the active user.
    Storage.save('activeUser', [ user._id, user._kmd.authtoken ]);
  }
  else {// Delete the active user.
    Storage.destroy('activeUser');
  }

  // Return the previous active user.
  return result;
};

/**
 * Initializes the library for use with Kinvey services.
 *
 * @param {Options}  options Options.
 * @param {string}  [options.clientAppVersion]   Client App Version.
 * @param {Object}  [options.customRequestProperties] Customer request properties.
 * @param {string}  [options.apiHostName]  API Host Name. Must use the `https` protocol
 * @param {string}  [options.micHostName]  MIC Host Name. Must use the `https` protocol
 * @param {string}   options.appKey        App Key.
 * @param {string}  [options.appSecret]    App Secret.
 * @param {string}  [options.masterSecret] Master Secret. **Never use the
 *          Master Secret in client-side code.**
 * @param {boolean} [options.refresh=true] Refresh the active user (if any).
 * @param {Object}  [options.sync]         Synchronization options.
 * @returns {Promise} The active user.
 */
Kinvey.init = function(options) {
  var error;

  // Debug.
  if(KINVEY_DEBUG) {
    log('Initializing the copy of the library.', arguments);
  }

  // Validate arguments.
  options = options || {};
  if(null == options.appKey) {
    error =  new Kinvey.Error('options argument must contain: appKey.');
    return wrapCallbacks(Kinvey.Defer.reject(error), options);
  }
  if(null == options.appSecret && null == options.masterSecret) {
    error = new Kinvey.Error('options argument must contain: appSecret and/or masterSecret.');
    return wrapCallbacks(Kinvey.Defer.reject(error), options);
  }

  // The active user is not ready yet.
  activeUserReady = false;

  // Set the API host name
  var apiHostName = options.apiHostName || Kinvey.API_ENDPOINT;
  Kinvey.APIHostName = apiHostName || Kinvey.APIHostName;

  // Check if Kinvey.APIHostName uses https protocol
  if (Kinvey.APIHostName.indexOf('https://') !== 0) {
    error =new Kinvey.Error('Kinvey requires https as the protocol when setting' +
                           ' Kinvey.APIHostName, instead found the protocol ' +
                           Kinvey.APIHostName.substring(0, Kinvey.APIHostName.indexOf(':/')) +
                           ' in Kinvey.APIHostName: ' + Kinvey.APIHostName);
    return wrapCallbacks(Kinvey.Defer.reject(error), options);
  }

  // Set the MIC host name
  Kinvey.MICHostName = options.micHostName || Kinvey.MICHostName;

  // Check if Kinvey.MICHostName uses https protocol
  if (Kinvey.MICHostName.indexOf('https://') !== 0) {
    error = new Kinvey.Error('Kinvey requires https as the protocol when setting' +
                           ' Kinvey.MICHostName, instead found the protocol ' +
                           Kinvey.MICHostName.substring(0, Kinvey.MICHostName.indexOf(':/')) +
                           ' in Kinvey.MICHostName: ' + Kinvey.MICHostName);
    return wrapCallbacks(Kinvey.Defer.reject(error), options);
  }

  // Set the Client App Version
  if (options.clientAppVersion != null) {
    Kinvey.ClientAppVersion.setVersion(options.clientAppVersion);
  }

  // Set the custom request properties
  if (options.customRequestProperties != null) {
    Kinvey.CustomRequestProperties.setProperties(options.customRequestProperties);
  }

  // Save credentials.
  Kinvey.appKey       = options.appKey;
  Kinvey.appSecret    = null != options.appSecret    ? options.appSecret    : null;
  Kinvey.masterSecret = null != options.masterSecret ? options.masterSecret : null;

  // Set the encryption key.
  Kinvey.encryptionKey = null != options.encryptionKey ? options.encryptionKey : null;

  // Initialize the synchronization namespace and restore the active user.
  var promise = Kinvey.Sync.init(options.sync).then(function() {
    log('Kinvey initialized, running version: js-<%= build %>/<%= pkg.version %>');
    return restoreActiveUser(options);
  });
  return wrapCallbacks(promise, options);
};

/**
 * Pings the Kinvey service.
 *
 * @param {Object} [options] Options.
 * @returns {Promise} The response.
 */
Kinvey.ping = function(options) {
  // Debug.
  if(KINVEY_DEBUG) {
    log('Pinging the Kinvey service.', arguments);
  }

  // Cast arguments.
  options = options || {};

  // The top-level ping is not compatible with `options.nocache`.
  options.nocache = null == Kinvey.appKey ? false : options.nocache;

  // Prepare the response. If the library copy has not been initialized yet,
  // ping anonymously.
  var promise = Kinvey.Persistence.read({
    namespace : DATA_STORE,
    auth      : null != Kinvey.appKey ? Auth.All : Auth.None
  }, options);

  // Debug.
  if(KINVEY_DEBUG) {
    promise.then(function(response) {
      log('Pinged the Kinvey service.', response);
    }, function(error) {
      log('Failed to ping the Kinvey service.', error);
    });
  }

  // Return the response.
  return wrapCallbacks(promise, options);
};

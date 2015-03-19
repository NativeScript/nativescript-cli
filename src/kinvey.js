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

// App Version is private. Do NOT document.
Kinvey.APP_VERSION = undefined;

// Custom Request Properties is private. Do NOT document.
Kinvey.CUSTOM_REQUEST_PROPERTIES = {};

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
 * Returns the app version for the application or `undefined`
 * if a version was not set.
 *
 * @return {?string} The app version or `undefined`.
 */
Kinvey.getAppVersion = function() {
  return Kinvey.APP_VERSION;
};

/**
 * Set the app version for the application.
 *
 * @param {string} version App version for the application
 */
Kinvey.setAppVersion = function(version) {
  var appVersion = version;
  var major, minor, patch;

  // Debug
  if (KINVEY_DEBUG) {
    log('Setting the app version.', arguments);
  }

  // Set app version using specified major, minor, and patch
  // provided as arguments.
  if (arguments.length > 1) {
    // Get individual parts of app version
    major = arguments[0];
    minor = arguments[1];
    patch = arguments[2];

    // Validate that major is a string
    if (!isString(major)) {
      throw new Kinvey.Error('Major value of version must be a string.');
    }

    // Set app version to major value
    appVersion = major;

    // Append minor value if it was provided
    if (minor != null) {
      // Validate that minor is a string
      if (!isString(minor)) {
        throw new Kinvey.Error('Minor value of version must be a string.');
      }

      // Validate that minor is not an empty string
      if (isEmptyString(minor)) {
        throw new Kinvey.Error('Not able to set minor value of version to an empty string.');
      }

      appVersion += '.' + minor;
    }

    // Append patch value if it was provided
    if (patch != null) {
      // Validate that patch is a string
      if (!isString(patch)) {
        throw new Kinvey.Error('Patch value of version must be a string.');
      }

      // Validate that patch is not an empty string
      if (isEmptyString(patch)) {
        throw new Kinvey.Error('Not able to set patch value of version to an empty string.');
      }

      appVersion += '.' + patch;
    }
  } else if (appVersion != null) {
    // Validate that version is a string
    if (!isString(appVersion)) {
      throw new Kinvey.Error('Version must be a string.');
    }

    // Validate that version is not an empty string
    if (isEmptyString(appVersion)) {
      throw new Kinvey.Error('Not able to set version to an empty string.');
    }
  }

  // Set the app version
  Kinvey.APP_VERSION = appVersion;
};

/**
 * Returns the custom request properties sent for all API requests.
 *
 * @return {object} The custom request properties.
 */
Kinvey.getCustomRequestProperties = function() {
  return Kinvey.CUSTOM_REQUEST_PROPERTIES;
};

/**
 * Set the custom request properties for the application.
 *
 * @param {?Object} properties Properties to set or `undefined`
 *                             to remove all custom request properties.
 */
Kinvey.setCustomRequestProperties = function(properties) {
  Kinvey.CUSTOM_REQUEST_PROPERTIES = {};
  Kinvey.addCustomRequestProperties(properties);
};

/**
 * Add the properties to the custom request properties for the
 * application.
 *
 * @param {Object} properties Properties to add to cutsom request properties.
 */
Kinvey.addCustomRequestProperties = function(properties) {
  if (properties != null) {
    var customRequestProperties = Kinvey.CUSTOM_REQUEST_PROPERTIES || {};

    Object.keys(properties).map(function(key) {
      var value = properties[key];

      if (!isString(value)) {
        throw new Kinvey.Error('Custom property value for ' + key +
                               ' must be a string.');
      }

      if (!isEmptyString(value)) {
        customRequestProperties[key] = value;
      }
    });

    Kinvey.CUSTOM_REQUEST_PROPERTIES = customRequestProperties;
  }
};

/**
 * Add property name and value to custom request properties for the
 * application.
 *
 * @param {string} name Custom request property name.
 * @param {string} value Custom request property value.
 */
Kinvey.addCustomRequestProperty = function(name, value) {
  var property = {
    name: value
  };
  Kinvey.addCustomRequestProperties(property);
};

/**
 * Initializes the library for use with Kinvey services.
 *
 * @param {Options}  options Options.
 * @param {string}  [options.appVersion]   App Version.
 * @param {Object}  [options.customRequestProperties] Custome request properties.
 * @param {string}  [options.apiHostName]  API Host Name. Must use the `https` protocol
 * @param {string}   options.appKey        App Key.
 * @param {string}  [options.appSecret]    App Secret.
 * @param {string}  [options.masterSecret] Master Secret. **Never use the
 *          Master Secret in client-side code.**
 * @param {boolean} [options.refresh=true] Refresh the active user (if any).
 * @param {Object}  [options.sync]         Synchronization options.
 * @throws {Kinvey.Error} `options` must contain: `appSecret` or
 *                          `masterSecret`.
 * @throws {Kinvey.Error} Kinvey requires https as the protocol when setting Kinvey.APIHostName
 * @returns {Promise} The active user.
 */
Kinvey.init = function(options) {
  // Debug.
  if(KINVEY_DEBUG) {
    log('Initializing the copy of the library.', arguments);
  }

  // Validate arguments.
  options = options || {};
  if(null == options.appKey) {
    throw new Kinvey.Error('options argument must contain: appKey.');
  }
  if(null == options.appSecret && null == options.masterSecret) {
    throw new Kinvey.Error('options argument must contain: appSecret and/or masterSecret.');
  }

  // The active user is not ready yet.
  activeUserReady = false;

  // Set the API endpoint
  var apiHostName = options.apiHostName || Kinvey.API_ENDPOINT;
  Kinvey.APIHostName = apiHostName || Kinvey.APIHostName;

  // Check if Kinvey.APIHostName uses https protocol
  if (Kinvey.APIHostName.indexOf('https://') !== 0) {
    throw new Kinvey.Error('Kinvey requires https as the protocol when setting' +
                           ' Kinvey.APIHostName, instead found the protocol ' +
                           Kinvey.APIHostName.substring(0, Kinvey.APIHostName.indexOf(':/')) +
                           ' in Kinvey.APIHostName: ' + Kinvey.APIHostName);
  }

  // Set the App Version
  if (options.appVersion != null) {
    Kinvey.setAppVersion(options.appVersion);
  }

  // Set the custom request properties
  if (options.customRequestProperties != null) {
    Kinvey.setCustomRequestProperties(options.customRequestProperties);
  }

  // Save credentials.
  Kinvey.appKey       = options.appKey;
  Kinvey.appSecret    = null != options.appSecret    ? options.appSecret    : null;
  Kinvey.masterSecret = null != options.masterSecret ? options.masterSecret : null;

  // Set the encryption key.
  Kinvey.encryptionKey = null != options.encryptionKey ? options.encryptionKey : null;

  // Initialize the synchronization namespace and restore the active user.
  var promise = Kinvey.Sync.init(options.sync).then(function() {
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

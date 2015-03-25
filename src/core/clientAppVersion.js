/**
 * Copyright 2015 Kinvey, Inc.
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

// Client App Version
// ----

// Set app version for the application.

var clientAppVersion;

var parseAppVersion = function() {
  var version = arguments[0];

  // Set app version using specified major, minor, and patch
  // provided as arguments.
  if (arguments.length > 1) {
    // Get individual parts of app version
    var major = arguments[0];
    var minor = arguments[1];
    var patch = arguments[2];

    // Set app version to major value
    version = (major + '').trim();

    // Append minor value if it was provided
    if (minor != null) {
      version += ('.' + minor).trim();
    }

    // Append patch value if it was provided
    if (patch != null) {
      version += ('.' + patch).trim();
    }
  }

  return version;
};

var stringifyAppVersion = function(version) {
  if (null == version) {
    return undefined;
  }

  return (version + '').trim();
};

var clearClientAppVersion = function() {
  clientAppVersion = undefined;
};

/**
 * @memberof! <global>
 * @namespace Kinvey.ClientAppVersion
 */
Kinvey.ClientAppVersion = /** @lends Kinvey.ClientAppVersion */ {

  /**
   * Returns a string representation of the client app version or
   * `undefined` if one has not been set.
   *
   * @return {?string} A string representation of the client app
   *                   version or `undefined`.
   */
  stringValue: function() {
    return stringifyAppVersion(clientAppVersion);
  },

  /**
   * Sets the client app version for the application.
   */
  setVersion: function() {
    Kinvey.ClientAppVersion.clear();

    // Debug
    if (KINVEY_DEBUG) {
      log('Setting the client app version.', arguments);
    }

    clientAppVersion = parseAppVersion.apply(root, arguments);
  },

  /**
   * Clears the client app version that is set for the application.
   */
  clear: function() {
    // Debug
    if (KINVEY_DEBUG) {
      log('Clearing the client app version.');
    }

    clearClientAppVersion();
  }
};


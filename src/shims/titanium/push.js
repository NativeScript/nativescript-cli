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

// Push.
// -----

// REST API wrapper for setting up push notifications.

/**
 * @memberof! <global>
 * @namespace Kinvey.Push
 */
Kinvey.Push = /** @lends Kinvey.Push */{
  /**
   * Registers a device to receive push notifications.
   *
   * @param {string}  deviceId The device ID.
   * @param {Options} [options] Options.
   * @param {string}  [options.userId] The linked user. Use in conjunction with
   *         Master Secret.
   * @returns {Promise} The response.
   */
  register: function(deviceId, options) {
    var error;
    var platform;

    // Debug.
    logger.debug('Registering a device to receive push notifications.', arguments);

    // Cast arguments.
    options = options || {};

    // Validate arguments.
    var activeUser = Kinvey.getActiveUser();
    if(null === activeUser && null == options.userId) {
      error = new Kinvey.Error('options argument must contain: userId.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Get the platform
    platform = Titanium.Platform.getName();
    platform = platform === 'iPhone OS' ? 'ios' : platform;

    // Handle unsupported platforms
    if (platform !== 'android' || platform !== 'ios') {
      error = clientError(Kinvey.Error.PUSH_ERROR, {
        description: 'Kinvey currently does not support ' + platform + ' for push notifications.'
      });
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.Net.create({
      namespace : PUSH,
      id        : 'register-device',
      data      : {
        platform : platform.toLowerCase(),
        framework: 'titanium',
        deviceId : deviceId,
        userId   : null != activeUser ? null : options.userId
      },
      auth      : null != activeUser ? Auth.Session : Auth.Master
    }, options);

    // Debug.
    promise.then(function(response) {
      logger.debug('Registered the device to receive push notifications.', response);
    }, function(error) {
      logger.error('Failed to register the device to receive push notifications.', error);
    });

    // Return the response.
    return wrapCallbacks(promise, options);
  },

  /**
   * Unregisters a device from receiving push notifications.
   *
   * @param {string}  deviceId The device ID.
   * @param {Options} [options] Options.
   * @param {string}  [options.userId] The linked user. Use in conjunction with
   *         Master Secret.
   * @returns {Promise} The response.
   */
  unregister: function(deviceId, options) {
    var error;
    var platform;

    // Debug.
    logger.debug('Registering a device to receive push notifications.', arguments);

    // Cast arguments.
    options = options || {};

    // Validate arguments.
    var activeUser = Kinvey.getActiveUser();
    if(null === activeUser && null == options.userId) {
      error = new Kinvey.Error('options argument must contain: userId.');
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Get the platform
    platform = Titanium.Platform.getName();
    platform = platform === 'iPhone OS' ? 'ios' : platform;

    // Handle unsupported platforms
    if (platform !== 'android' || platform !== 'ios') {
      error = clientError(Kinvey.Error.PUSH_ERROR, {
        description: 'Kinvey currently does not support ' + platform + ' for push notifications.'
      });
      return wrapCallbacks(Kinvey.Defer.reject(error), options);
    }

    // Prepare the response.
    var promise = Kinvey.Persistence.Net.create({
      namespace : PUSH,
      id        : 'unregister-device',
      data      : {
        platform : platform.toLowerCase(),
        framework: 'titanium',
        deviceId : deviceId,
        userId   : null != activeUser ? null : options.userId
      },
      auth      : null != activeUser ? Auth.Session : Auth.Master
    }, options);

    // Debug.
    promise.then(function(response) {
      logger.debug('Unregistered the device from receiving push notifications.', response);
    }, function(error) {
      logger.error('Failed to unregister the device from receiving push notifications.', error);
    });

    // Return the response.
    return wrapCallbacks(promise, options);
  }
};

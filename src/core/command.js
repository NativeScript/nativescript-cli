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

// Custom Endpoints.
// -----------------

/**
 * Executes a custom command.
 *
 * @param {string} id The endpoint.
 * @param {Object} [args] Command arguments.
 * @param {Options} [options] Options.
 * @returns {Promise} The response.
 */
Kinvey.execute = function(id, args, options) {
  // Debug.
  logger.debug('Executing custom command.', arguments);

  // Cast arguments.
  options = options || {};

  // Prepare the response.
  var promise = Kinvey.Persistence.create({
    namespace  : RPC,
    collection : 'custom',
    id         : id,
    data       : args,
    auth       : Auth.Default
  }, options).then(null, function(error) {
    // If `REQUEST_ERROR`, the debug object may hold an actual custom response.
    if(Kinvey.Error.REQUEST_ERROR === error.name && isObject(error.debug)) {
      return Kinvey.Defer.reject(error.debug);
    }
    return Kinvey.Defer.reject(error);
  });

  // Debug.
  promise.then(function(response) {
    logger.debug('Executed the custom command.', response);
  }, function(error) {
    logger.error('Failed to execute the custom command.', error);
  });

  // Return the response.
  return wrapCallbacks(promise, options);
};

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
  if(KINVEY_DEBUG) {
    log('Executing custom command.', arguments);
  }

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
  if(KINVEY_DEBUG) {
    promise.then(function(response) {
      log('Executed the custom command.', response);
    }, function(error) {
      log('Failed to execute the custom command.', error);
    });
  }

  // Return the response.
  return wrapCallbacks(promise, options);
};
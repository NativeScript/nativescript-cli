// Error-handling.
// ---------------

// Backbone errors.
/**
 * @memberof Kinvey.Error
 * @constant
 * @default
 */
Kinvey.Error.NOT_LOGGED_IN = 'NotLoggedIn';

/**
 * Not logged in.
 *
 * @constant
 * @type {Object}
 * @default
 */
ClientError[Kinvey.Error.NOT_LOGGED_IN] = {
  name        : Kinvey.Error.NOT_LOGGED_IN,
  description : 'This user is not logged in.',
  debug       : ''
};
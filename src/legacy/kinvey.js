const Client = require('../core/client');
const User = require('./user');
const Kinvey = {};

// Classes
Kinvey.User = User;
Kinvey.DataStore = require('./datastore');

/**
 * Initializes the library by creating a new instance of the CLient class and storing it as a shared instance.
 *
 * @param {Object} options - Options
 * @param {string} options.appId - My app's id
 * @param {string} [options.appSecret] - My app's secret
 * @param {string} [options.masterSecret] - My app's master secret
 * @param {string} [options.encryptionKey] - My app's encryption key
 * @param {string} [options.apiUrl] - The url to send Kinvey API requests.
 *
 * @throws {KinveyError}  If an `options.appId` is not provided.
 * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
 *
 * @return {Client}  An instance of Client.
 *
 * @example
 * var sharedInstance = Kinvey.init({
 *   appId: 'appId',
 *   appSecret: 'appSecret'
 * });
 */
Kinvey.init = function(options) {
  const client = Client.init(options);
  return User.getActive(client);
};

Kinvey.getActiveUser = function(client) {
  return User.getActive(client);
};

// Export
module.exports = Kinvey;

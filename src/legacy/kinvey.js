const Client = require('../core/client');
const User = require('./user');
const RequestProperties = require('./requestProperties');
const Kinvey = {};

// Classes
Kinvey.Acl = require('./acl');
Kinvey.ClientAppVersion = RequestProperties.ClientAppVersion;
Kinvey.CustomRequestProperties = RequestProperties.CustomRequestProperties;
Kinvey.DataStore = require('./datastore');
Kinvey.Defer = require('./defer');
Kinvey.Error = require('./error');
Kinvey.File = require('./file');
Kinvey.Group = require('./group');
Kinvey.Metadata = require('./metadata');
Kinvey.Query = require('./query');
Kinvey.Social = require('./social');
Kinvey.Sycn = require('./sync');
Kinvey.User = User;
Kinvey.User.MIC = require('./mic');

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

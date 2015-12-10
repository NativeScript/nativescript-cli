const Client = require('./core/client');
const Kinvey = {};

// Core
Kinvey.Acl = require('./core/acl');
Kinvey.Aggregation = require('./core/aggregation');
Kinvey.Client = Client;
Kinvey.Collection = require('./core/collections/collection');
Kinvey.Enums = require('./core/enums');
Kinvey.File = require('./core/models/file');
Kinvey.Group = require('./core/aggregation');
Kinvey.Log = require('./core/log');
Kinvey.Metadata = require('./core/kmd');
Kinvey.Model = require('./core/models/model');
Kinvey.Query = require('./core/query');
Kinvey.Store = require('./core/store');
Kinvey.Sync = require('./core/sync');
Kinvey.User = require('./core/models/user');

// Errors
Kinvey.Error = require('./core/errors').KinveyError;
Kinvey.ActiveUserError = require('./core/errors').ActiveUserError;
Kinvey.NotFoundError = require('./core/errors').NotFoundError;

// Rack
Kinvey.Rack = require('./rack/rack');
Kinvey.Rack.Middleware = require('./rack/middleware');
Kinvey.Rack.Cache = require('./rack/cache');
Kinvey.Rack.Http = require('./rack/http');
Kinvey.Rack.Parser = require('./rack/parser');
Kinvey.Rack.Serializer = require('./rack/serializer');

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
  return client;
};

// Export
module.exports = Kinvey;

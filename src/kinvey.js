const Client = require('./core/client');
const Kinvey = {};

// Core
Kinvey.Acl = require('./core/acl');
Kinvey.Aggregation = require('./core/aggregation');
Kinvey.Client = Client;
Kinvey.Datastore = require('./core/datastores/datastore');
Kinvey.File = require('./core/models/file');
Kinvey.Group = require('./core/aggregation');
Kinvey.Logger = require('./core/logger');
Kinvey.Metadata = require('./core/metadata');
Kinvey.Model = require('./core/models/model');
Kinvey.Query = require('./core/query');
Kinvey.User = require('./core/models/user');

// Enums
Kinvey.DataPolicy = require('./core/enums/dataPolicy');
Kinvey.HttpMethod = require('./core/enums/httpMethod');
Kinvey.RackType = require('./core/enums/rackType');
Kinvey.ResponseType = require('./core/enums/responseType');
Kinvey.SocialAdapter = require('./core/enums/socialAdapter');
Kinvey.StatusCode = require('./core/enums/statusCode');
Kinvey.StoreAdapter = require('./core/enums/storeAdapter');

// Errors
Kinvey.Error = require('./core/errors').KinveyError;
Kinvey.ActiveUserError = require('./core/errors').ActiveUserError;
Kinvey.NotFoundError = require('./core/errors').NotFoundError;

// Middleware
Kinvey.Middleware = require('./rack/middleware/middleware');
Kinvey.Middleware.Cache = require('./rack/middleware/cache');
Kinvey.Middleware.Http = require('./rack/middleware/http');
Kinvey.Middleware.Parser = require('./rack/middleware/parser');
Kinvey.Middleware.Serializer = require('./rack/middleware/serializer');

// Rack
Kinvey.Rack = require('./rack/rack');

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

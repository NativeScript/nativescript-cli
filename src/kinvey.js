import Client from './core/client';
import when from 'when';
const sharedClientInstanceSymbol = Symbol();
const Kinvey = {};

// Core
Kinvey.Acl = require('./core/acl');
Kinvey.Aggregation = require('./core/aggregation');
Kinvey.Client = Client;
Kinvey.Datastore = require('./core/datastore');
Kinvey.Group = require('./core/group');
Kinvey.Metadata = require('./core/metadata');
Kinvey.Query = require('./core/query');
Kinvey.User = require('./core/models/user');

// Enums
Kinvey.AuthType = require('./core/enums/authType');
Kinvey.DataPolicy = require('./core/enums/dataPolicy');
Kinvey.HttpMethod = require('./core/enums/httpMethod');
Kinvey.RackType = require('./core/enums/rackType');
Kinvey.StatusCode = require('./core/enums/statusCode');

// Errors
Kinvey.Error = require('./core/errors/error');
Kinvey.ActiveUserError = require('./core/errors/activeUserError');
Kinvey.NotFoundError = require('./core/errors/notFoundError');

// Middleware
Kinvey.Middleware = require('./rack/middleware/middleware');
Kinvey.Middleware.Cache = require('./rack/middleware/cache');
Kinvey.Middleware.Database = require('./rack/middleware/database');
Kinvey.Middleware.Http = require('./rack/middleware/http');
Kinvey.Middleware.Parser = require('./rack/middleware/parser');
Kinvey.Middleware.Serializer = require('./rack/middleware/serializer');

// Rack
Kinvey.Rack = require('./rack/rack');

/**
 * Initializes the library by creating a new instance of the CLient class and storing it as a shared instance.
 *
 * @param {Object} options - Options
 * @param {string} options.appKey - My app's key
 * @param {string} [options.appSecret] - My app's secret
 * @param {string} [options.masterSecret] - My app's master secret
 * @param {string} [options.encryptionKey] - My app's encryption key
 * @param {string} [options.apiUrl] - The url to send Kinvey API requests.
 * @param {number} [options.apiVersion] - The version of the Kinvey API to use.
 * @param {string} [options.micApiUrl] - The url to use to connect with Mobile Identity Connect (MIC).
 * @param {number} [options.micApiVersion] - The version of Mobile Identity Connect (MIC) to use.
 *
 * @throws {KinveyError}  If an `options.appkey` is not provided.
 * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
 *
 * @return {Client}  An instance of Client.
 *
 * @example
 * var sharedInstance = Kinvey.init({
 *   appKey: 'appKey',
 *   appSecret: 'appSecret'
 * });
 */
Kinvey.init = function(options = {}) {
  const client = new Client(options);
  Kinvey[sharedClientInstanceSymbol] = client;
  return when.resolve(client);
};

/**
 * Returns the shared client instance used by the library.
 *
 * @throws {KinveyError} If `Kinvey.init()` has not been called.
 *
 * @return {Client} The shared instance.
 */
Kinvey.sharedClientInstance = function() {
  const client = Kinvey[sharedClientInstanceSymbol];

  if (!client) {
    throw new KinveyError('You have not initialized the library. Please call `Kinvey.init()` before accessing the shared instance.');
  }

  return client;
};

// Export
export default Kinvey;

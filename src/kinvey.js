import Acl from './core/acl';
import Aggregation from './core/aggregation';
import Cache from './core/cache';
import Client from './core/client';
import Command from './core/command';
import Enums from './core/enums';
import File from './core/models/file';
import Log from './core/log';
import Kmd from './core/kmd';
import Model from './core/models/model';
import Query from './core/query';
import Store from './core/stores/store';
import Sync from './core/sync';
import User from './core/models/user';
const Kinvey = {
  Acl,
  Aggregation,
  Cache,
  Client,
  Command,
  Enums,
  File,
  Log,
  Metadata: Kmd,
  Model,
  Promise,
  Query,
  Store,
  Sync,
  User
};

/**
 * Initializes the library by creating a new instance of the Client
 * class and storing it as a shared instance.
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
Kinvey.init = function (options) {
  const client = Client.init(options);
  return client;
};

/**
 * Alias to Kinvey.init
 */
Kinvey.initialize = function (options) {
  return Kinvey.init(options);
};

// Export
export default Kinvey;

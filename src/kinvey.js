import Acl from './core/acl';
import Aggregation from './core/aggregation';
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
 * Initializes the library with your app's information.
 *
 * @param   {Object}        options                         Options
 * @param   {string}        options.appKey                  My app key
 * @param   {string}        [options.appSecret]             My app secret
 * @param   {string}        [options.masterSecret]          My app's master secret
 * @param   {string}        [options.encryptionKey]         My app's encryption key
 * @param   {string}        [options.protocol]              The protocol of the client.
 * @param   {string}        [options.host]                  The host of the client.
 * @return  {Client}                                        An instance of Client.
 *
 * @throws  {KinveyError}  If an `options.appKey` is not provided.
 * @throws  {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
 *
 * @example
 * var client = Kinvey.init({
 *   appKey: 'appKey',
 *   appSecret: 'appSecret'
 * });
 */
Kinvey.init = function (options) {
  const client = Client.init(options);
  return client;
};

export default Kinvey;

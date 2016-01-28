import Aggregation from './core/aggregation';
import Client from './core/client';
import Command from './core/command';
import Enums from './core/enums';
import File from './core/models/file';
import Files from './core/stores/files';
import Log from './core/log';
import Metadata from './core/metadata';
import Query from './core/query';
import DataStore from './core/stores/datastore';
import Sync from './core/sync';
import User from './core/models/user';
import Users from './core/stores/users';

export default class Kinvey {
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
  static init(options) {
    const client = Client.init(options);
    return client;
  }
}

Kinvey.Aggregation = Aggregation;
Kinvey.Command = Command;
Kinvey.DataStore = DataStore;
Kinvey.File = File;
Kinvey.Files = Files;
Kinvey.Log = Log;
Kinvey.Metadata = Metadata;
Kinvey.Promise = Promise;
Kinvey.Query = Query;
Kinvey.Sync = Sync;
Kinvey.User = User;
Kinvey.Users = Users;

['AuthorizationGrant', 'ReadPolicy', 'SocialIdentity', 'DataStoreType'].forEach(enumKey => {
  Kinvey[enumKey] = Enums[enumKey];
});

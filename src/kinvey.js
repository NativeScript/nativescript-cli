import Aggregation from './core/aggregation';
import Client from './core/client';
import Command from './core/command';
import FileStore from './core/stores/filesStore';
import Log from './core/log';
import Metadata from './core/metadata';
import Query from './core/query';
import DataStore from './core/stores/dataStore';
import Sync from './core/sync';
import { User } from './core/user';
import { AuthorizationGrant, ReadPolicy, SocialIdentity, HttpMethod, DataStoreType } from './core/enums';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

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

  /**
   * Pings the Kinvey service.
   *
   * @returns {Promise} The response.
   */
  static ping() {
    const client = Client.sharedInstance();

    return client.executeNetworkRequest({
      method: HttpMethod.GET,
      auth: client.allAuth(),
      pathname: `${appdataNamespace}/${client.appKey}`
    }).then(response => {
      return response.data;
    });
  }
}

Kinvey.Aggregation = Aggregation;
Kinvey.AuthorizationGrant = AuthorizationGrant;
Kinvey.Command = Command;
Kinvey.DataStore = DataStore;
Kinvey.DataStoreType = DataStoreType;
Kinvey.FileStore = FileStore;
Kinvey.Log = Log;
Kinvey.Metadata = Metadata;
Kinvey.Promise = Promise;
Kinvey.Query = Query;
Kinvey.ReadPolicy = ReadPolicy;
Kinvey.SocialIdentity = SocialIdentity;
Kinvey.Sync = Sync;
Kinvey.User = User;

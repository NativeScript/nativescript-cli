import { KinveyError } from './errors';
import { Aggregation } from './aggregation';
import Client from './client';
import CustomEndpoint from './endpoint';
import { Log } from './log';
import { Metadata } from './metadata';
import { Query } from './query';
import { DataStore, DataStoreType } from './datastore';
import { FileStore } from './filestore';
import Sync from './sync';
import { User } from './user';
import { UserStore } from './userstore';
import { AuthorizationGrant, SocialIdentity } from './mic';
import { NetworkRequest } from './requests/network';
import { AuthType, RequestMethod } from './requests/request';
import url from 'url';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
let client = null;

export default class Kinvey {
  static get client() {
    if (!client) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return client;
  }

  static get appVersion() {
    return this.client.appVersion;
  }

  static set appVersion(appVersion) {
    this.client.appVersion = appVersion;
  }

  /**
   * Initializes the library with your app's information.
   *
   * @param   {Object}        options                         Options
   * @param   {string}        options.appKey                Kinvey App Key
   * @param   {string}        [options.appSecret]             Kinvey App Secret
   * @param   {string}        [options.masterSecret]          Kinvey Master Secret
   * @param   {string}        [options.encryptionKey]         Your applications encryption key
   * @param   {string}        [options.hostname]              Custom Kinvey API Hostname
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
    // Check that an appKey or appId was provided
    if (!options.appKey && !options.appId) {
      throw new KinveyError('No App Key was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    // Check that an appSecret or masterSecret was provided
    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    // Initialize the client
    client = Client.init(options);

    // Add all the modules to the Kinvey namespace
    this.Aggregation = Aggregation;
    this.AuthorizationGrant = AuthorizationGrant;
    this.CustomEndpoint = CustomEndpoint;
    this.DataStore = DataStore;
    this.DataStoreType = DataStoreType;
    this.FileStore = FileStore;
    this.Log = Log;
    this.Metadata = Metadata;
    this.Query = Query;
    this.SocialIdentity = SocialIdentity;
    this.Sync = Sync;
    this.User = User;
    this.UserStore = UserStore;

    // Return the client
    return client;
  }

  /**
   * Pings the Kinvey service.
   *
   * @returns {Promise} The response.
   */
  static async ping(client = Client.sharedInstance()) {
    const request = new NetworkRequest({
      method: RequestMethod.GET,
      authType: AuthType.All,
      url: url.format({
        protocol: client.protocol,
        host: client.host,
        pathname: `${appdataNamespace}/${client.appKey}`
      })
    });
    const response = await request.execute();
    return response.data;
  }
}

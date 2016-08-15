import { Client } from './client';
import { CustomEndpoint } from './endpoint';
import { Log } from './utils';
import { DataStore, DataStoreType, FileStore, Sync, Query, Aggregation } from './datastore';
import { Acl, Metadata, User, UserStore } from './entity';
import { AuthorizationGrant, SocialIdentity } from './social';
import { AuthType, RequestMethod, KinveyError, KinveyRequest } from './request';
import { KinveyRackManager } from './rack';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The Kinvey class is used as the entry point for the Kinvey JavaScript SDK.
 */
export class Kinvey {
  /**
   * Returns the shared instance of the Client class used by the SDK.
   *
   * @throws {KinveyError} If a shared instance does not exist.
   *
   * @return {Client} The shared instance.
   *
   * @example
   * var client = Kinvey.client;
   */
  static get client() {
    return Client.sharedInstance();
  }

  /**
   * The version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   *
   * @return {String} The version of your app.
   *
   * @example
   * var appVersion = Kinvey.appVersion;
   */
  static get appVersion() {
    return this.client.appVersion;
  }

  /**
   * Set the version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   *
   * @param  {String} appVersion  App version.
   *
   * @example
   * Kinvey.appVersion = '1.0.0';
   * // or
   * Kinvey.appVersion = 'v1';
   */
  static set appVersion(appVersion) {
    this.client.appVersion = appVersion;
  }

  /**
   * Get the rack manager module.
   *
   * @return {KinveyRackManager} The KinveyRackManager module.
   *
   * @example
   * var RackManager = Kinvey.RackManager;
   */
  static get RackManager() {
    return KinveyRackManager;
  }

  /**
   * Get the logging module.
   *
   * @return {Log}  The log module.
   *
   * @example
   * var Log = Kinvey.Log;
   */
  static get Log() {
    return Log;
  }

  /**
   * Initializes the library with your app's information.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      A client instance.
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
    if (!options.appKey) {
      throw new KinveyError('No App Key was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    // Check that an appSecret or masterSecret was provided
    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    // Initialize the client
    const client = Client.init(options);

    // Add all the modules to the Kinvey namespace
    this.Acl = Acl;
    this.Aggregation = Aggregation;
    this.AuthorizationGrant = AuthorizationGrant;
    this.CustomEndpoint = CustomEndpoint;
    this.DataStore = DataStore;
    this.DataStoreType = DataStoreType;
    this.Files = new FileStore();
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
   * Pings the Kinvey API service.
   *
   * @returns {Promise<Object>} The response from the ping request.
   *
   * @example
   * var promise = Kinvey.ping().then(function(response) {
   *   console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
   * }).catch(function(error) {
   *   console.log('Kinvey Ping Failed. Response: ' + error.description);
   * });
   */
  static async ping(client = Client.sharedInstance()) {
    const request = new KinveyRequest({
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

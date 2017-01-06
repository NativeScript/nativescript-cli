import { Client } from './client';
import { CustomEndpoint } from './endpoint';
import Query from './query';
import { Log } from 'common/utils';
import Aggregation from './aggregation';
import DataStore, { DataStoreType, FileStore, UserStore } from './datastore';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant } from './identity';
import { AuthType, CacheRack, NetworkRack, Rack, RequestMethod, KinveyRequest } from './request';
import {
  ActiveUserError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NoNetworkConnectionError,
  NoActiveUserError,
  NotFoundError,
  NoResponseError,
  ParameterValueOutOfRangeError,
  PopupError,
  QueryError,
  ServerError,
  SyncError
} from 'common/errors';
import url from 'url';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

/**
 * The Kinvey class is used as the entry point for the Kinvey JavaScript SDK.
 */
class Kinvey {
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
   * Initializes the SDK with your app's information.
   *
   * @deprecated Use `Kinvey.initialize` instead.
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
  static init(options = {}) {
    // Check that an appKey or appId was provided
    if (!options.appKey) {
      throw new KinveyError('No App Key was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    // Check that an appSecret or masterSecret was provided
    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    // Initialize the client
    const client = Client.init(options);

    // Return the client
    return client;
  }

  /**
   * Initializes the SDK with your app's information. The SDK is initialized when the returned
   * promise resolves.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Promise}                                                     A promise.
   *
   * @throws  {KinveyError}  If an `options.appKey` is not provided.
   * @throws  {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @example
   * Kinvey.initialize({
   *   appKey: 'appKey',
   *   appSecret: 'appSecret'
   * }).then(function(client) {
   *   // ...
   * }).catch(function(error) {
   *   // ...
   * });
   */
  static initialize(options = {}) {
    // Check that an appKey or appId was provided
    if (!options.appKey) {
      return Promise.reject(
        new KinveyError('No App Key was provided. ' +
          'Unable to create a new Client without an App Key.')
      );
    }

    // Check that an appSecret or masterSecret was provided
    if (!options.appSecret && !options.masterSecret) {
      return Promise.reject(
        new KinveyError('No App Secret or Master Secret was provided. ' +
          'Unable to create a new Client without an App Key.')
      );
    }

    // Initialize the client
    return Client.initialize(options)
      .then(() => {
        // Return the active user
        return User.getActiveUser();
      });
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
  static ping(client = Client.sharedInstance()) {
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      authType: AuthType.All,
      url: url.format({
        protocol: client.protocol,
        host: client.host,
        pathname: `${appdataNamespace}/${client.appKey}`
      })
    });

    return request.execute()
      .then(response => response.data);
  }
}

// Add modules
Kinvey.Acl = Acl;
Kinvey.Aggregation = Aggregation;
Kinvey.AuthorizationGrant = AuthorizationGrant;
Kinvey.CustomEndpoint = CustomEndpoint;
Kinvey.DataStore = DataStore;
Kinvey.DataStoreType = DataStoreType;
Kinvey.File = FileStore;
Kinvey.Files = FileStore;
Kinvey.Group = Aggregation;
Kinvey.Log = Log;
Kinvey.Metadata = Metadata;
Kinvey.Query = Query;
Kinvey.User = User;
Kinvey.Users = UserStore;
Kinvey.UserStore = UserStore;

// Add errors
Kinvey.ActiveUserError = ActiveUserError;
Kinvey.FeatureUnavailableError = FeatureUnavailableError;
Kinvey.IncompleteRequestBodyError = IncompleteRequestBodyError;
Kinvey.InsufficientCredentialsError = InsufficientCredentialsError;
Kinvey.InvalidCredentialsError = InvalidCredentialsError;
Kinvey.InvalidIdentifierError = InvalidIdentifierError;
Kinvey.InvalidQuerySyntaxError = InvalidQuerySyntaxError;
Kinvey.JSONParseError = JSONParseError;
Kinvey.KinveyError = KinveyError;
Kinvey.MissingQueryError = MissingQueryError;
Kinvey.MissingRequestHeaderError = MissingRequestHeaderError;
Kinvey.MissingRequestParameterError = MissingRequestParameterError;
Kinvey.MobileIdentityConnectError = MobileIdentityConnectError;
Kinvey.NoNetworkConnectionError = NoNetworkConnectionError;
Kinvey.NoActiveUserError = NoActiveUserError;
Kinvey.NotFoundError = NotFoundError;
Kinvey.NoResponseError = NoResponseError;
Kinvey.ParameterValueOutOfRangeError = ParameterValueOutOfRangeError;
Kinvey.PopupError = PopupError;
Kinvey.QueryError = QueryError;
Kinvey.ServerError = ServerError;
Kinvey.SyncError = SyncError;

// Add Racks
Kinvey.CacheRack = CacheRack;
Kinvey.NetworkRack = NetworkRack;
Kinvey.Rack = Rack;

// Export
export default Kinvey;

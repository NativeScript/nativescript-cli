import {
  ActiveUserError,
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppProblemError,
  BadRequestError,
  BLError,
  CORSDisabledError,
  DuplicateEndUsersError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  MobileIdentityConnectError,
  NetworkConnectionError,
  NoActiveUserError,
  NoResponseError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  PopupError,
  QueryError,
  ServerError,
  StaleRequestError,
  SyncError,
  TimeoutError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError
} from 'src/errors';
import { Log, isDefined } from 'src/utils';
import Client from './client';
import CustomEndpoint from './endpoint';
import Query from './query';
import Aggregation from './aggregation';
import DataStore, { DataStoreType, FileStore, SyncOperation } from './datastore';
import { Acl, Metadata, User } from './entity';
import { AuthorizationGrant } from './identity';
import { AuthType, CacheRack, NetworkRack, Rack, RequestMethod, KinveyRequest } from './request';

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
  static initialize() {
    throw new KinveyError('Please use Kinvey.init().');
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
   * const client = Kinvey.init({
   *   appKey: 'appKey',
   *   appSecret: 'appSecret'
   * });
   */
  static init(options = {}) {
    // Check that an appKey or appId was provided
    if (isDefined(options.appKey) === false) {
      throw new KinveyError('No App Key was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    // Check that an appSecret or masterSecret was provided
    if (isDefined(options.appSecret) === false && isDefined(options.masterSecret) === false) {
      throw new KinveyError('No App Secret or Master Secret was provided.'
        + ' Unable to create a new Client without an App Key.');
    }

    // Initialize the client
    return Client.init(options);
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
      url: `${this.client.apiHostname}/appdata/${client.appKey}`,
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
Kinvey.Files = new FileStore();
Kinvey.Group = Aggregation;
Kinvey.Log = Log;
Kinvey.Metadata = Metadata;
Kinvey.Query = Query;
Kinvey.SyncOperation = SyncOperation;
Kinvey.User = User;

// Add errors
Kinvey.ActiveUserError = ActiveUserError;
Kinvey.APIVersionNotAvailableError = APIVersionNotAvailableError;
Kinvey.APIVersionNotImplementedError = APIVersionNotImplementedError;
Kinvey.AppProblemError = AppProblemError;
Kinvey.BadRequestError = BadRequestError;
Kinvey.BLError = BLError;
Kinvey.CORSDisabledError = CORSDisabledError;
Kinvey.DuplicateEndUsersError = DuplicateEndUsersError;
Kinvey.FeatureUnavailableError = FeatureUnavailableError;
Kinvey.IncompleteRequestBodyError = IncompleteRequestBodyError;
Kinvey.IndirectCollectionAccessDisallowedError = IndirectCollectionAccessDisallowedError;
Kinvey.InsufficientCredentialsError = InsufficientCredentialsError;
Kinvey.InvalidCredentialsError = InvalidCredentialsError;
Kinvey.InvalidIdentifierError = InvalidIdentifierError;
Kinvey.InvalidQuerySyntaxError = InvalidQuerySyntaxError;
Kinvey.JSONParseError = JSONParseError;
Kinvey.KinveyError = KinveyError;
Kinvey.KinveyInternalErrorRetry = KinveyInternalErrorRetry;
Kinvey.KinveyInternalErrorStop = KinveyInternalErrorStop;
Kinvey.MissingQueryError = MissingQueryError;
Kinvey.MissingRequestHeaderError = MissingRequestHeaderError;
Kinvey.MissingRequestParameterError = MissingRequestParameterError;
Kinvey.MobileIdentityConnectError = MobileIdentityConnectError;
Kinvey.NoActiveUserError = NoActiveUserError;
Kinvey.NetworkConnectionError = NetworkConnectionError;
Kinvey.NoResponseError = NoResponseError;
Kinvey.NotFoundError = NotFoundError;
Kinvey.ParameterValueOutOfRangeError = ParameterValueOutOfRangeError;
Kinvey.PopupError = PopupError;
Kinvey.QueryError = QueryError;
Kinvey.ServerError = ServerError;
Kinvey.StaleRequestError = StaleRequestError;
Kinvey.SyncError = SyncError;
Kinvey.TimeoutError = TimeoutError;
Kinvey.UserAlreadyExistsError = UserAlreadyExistsError;
Kinvey.WritesToCollectionDisallowedError = WritesToCollectionDisallowedError;

// Add Racks
Kinvey.CacheRack = CacheRack;
Kinvey.NetworkRack = NetworkRack;
Kinvey.Rack = Rack;

// Export
export { Kinvey };
export default Kinvey;

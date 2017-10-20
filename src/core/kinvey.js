import { Promise } from 'es6-promise';
import { KinveyError } from './errors';
import { isDefined } from './utils';
import { Client } from './client';
import { User } from './entity';
import { AuthType, RequestMethod, KinveyRequest } from './request';

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
   * @deprecated Please use Kinvey.init().
   */
  static initialize(config) {
    try {
      const client = Kinvey.init(config);
      return Promise.resolve(User.getActiveUser(client));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Initializes the SDK with your app's configuration.
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
        + ' Unable to create a new Client without an App Secret.');
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

import { KinveyError } from './errors';
import { SyncManager } from './sync';
import localStorage from 'local-storage';
import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
const activeUserCollectionName = process.env.KINVEY_ACTIVE_USER_COLLECTION_NAME || 'kinvey_activeUser';
const activeSocialIdentityTokenCollectionName = process.env.KINVEY_ACTIVE_SOCIAL_IDENTITY_TOKEN_COLLECTION_NAME
                                                || 'kinvey_activeSocialIdentityToken';
const sharedInstanceSymbol = Symbol();

/**
 * The Client class stores information regarding your application. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 *
 * @example
 * var client = new Kinvey.Client({
 *   appKey: '<appKey>',
 *   appSecret: '<appSecret>'
 * });
 */
export class Client {
  /**
   * Creates a new instance of the Client class. An `options.appKey` must be provided along with
   * either and `options.appSecret` or `options.masterSecret`.
   *
   * @param {Object}    options                             Options
   * @param {string}    [options.protocol='https']          Protocl used for requests
   * @param {string}    [options.host='baas.kinvey.com']    Host used for requests
   * @param {string}    options.appKey                      App Key
   * @param {string}    [options.appSecret]                 App Secret
   * @param {string}    [options.masterSecret]              App Master Secret
   * @param {string}    [options.encryptionKey]             App Encryption Key
   *
   * @throws {KinveyError}  If an `options.appKey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   */
  constructor(options = {}) {
    options = assign({
      protocol: process.env.KINVEY_API_PROTOCOL || 'https:',
      host: process.env.KINVEY_API_HOST || 'baas.kinvey.com'
    }, options);

    if (!options.appKey && !options.appId) {
      throw new KinveyError('No App Key was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    if (options.hostname && isString(options.hostname)) {
      const hostnameParsed = url.parse(options.hostname);
      options.protocol = hostnameParsed.protocol;
      options.host = hostnameParsed.host;
    }

    /**
     * @type {string}
     */
    this.protocol = options.protocol;

    /**
     * @type {string}
     */
    this.host = options.host;

    /**
     * @type {string}
     */
    this.appKey = options.appKey || options.appId;

    /**
     * @type {string|undefined}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {string|undefined}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {string|undefined}
     */
    this.encryptionKey = options.encryptionKey;

    /**
     * @type {SyncManager}
     */
    this.syncManager = new SyncManager();
    this.syncManager.client = this;
  }

  get baseUrl() {
    return url.format({
      protocol: this.protocol,
      host: this.host
    });
  }

  getActiveUserData() {
    return localStorage.get(`${this.appKey}${activeUserCollectionName}`);
  }

  setActiveUserData(data) {
    if (data) {
      try {
        return localStorage.set(`${this.appKey}${activeUserCollectionName}`, data);
      } catch (error) {
        return false;
      }
    }

    return localStorage.remove(`${this.appKey}${activeUserCollectionName}`);
  }

  getActiveSocialIdentity() {
    return localStorage.get(`${this.appKey}${activeSocialIdentityTokenCollectionName}`);
  }

  setActiveSocialIdentity(socialIdentity) {
    if (socialIdentity) {
      try {
        return localStorage.set(`${this.appKey}${activeSocialIdentityTokenCollectionName}`, socialIdentity);
      } catch (error) {
        return false;
      }
    }

    return localStorage.remove(`${this.appKey}${activeSocialIdentityTokenCollectionName}`);
  }

  /**
   * Returns an object containing all the information for this Client.
   *
   * @return {Object} JSON
   */
  toJSON() {
    const json = {
      protocol: this.protocol,
      host: this.host,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey
    };

    return json;
  }

  /**
   * Initializes the library by creating a new instance of the
   * Client class and storing it as a shared instance.
   *
   * @param {Object}    options                             Options
   * @param {string}    [options.protocol='https']          Protocl used for requests
   * @param {string}    [options.host='baas.kinvey.com']    Host used for requests
   * @param {string}    options.appKey                      App Key
   * @param {string}    [options.appSecret]                 App Secret
   * @param {string}    [options.masterSecret]              App Master Secret
   * @param {string}    [options.encryptionKey]             App Encryption Key
   *
   * @throws {KinveyError}  If an `options.appKey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @return {Client}  An instance of Client.
   *
   * @example
   * var client = Kinvey.Client.init({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   */
  static init(options) {
    const client = new Client(options);
    Client[sharedInstanceSymbol] = client;
    return client;
  }

  /**
   * Returns the shared client instance used by the library.
   *
   * @throws {KinveyError} If `Kinvey.init()` has not been called.
   *
   * @return {Client} The shared instance.
   */
  static sharedInstance() {
    const client = Client[sharedInstanceSymbol];

    if (!client) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return client;
  }
}

export const sharedInstance = Client[sharedInstanceSymbol];

import MemoryCache from 'fast-memory-cache';
import url from 'url';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isNaN from 'lodash/isNaN';
import { KinveyError } from './errors';
import { Log } from './log';
import { isDefined, uuidv4, isValidStorageProviderValue } from './utils';
import { StorageProvider } from './datastore';

const DEFAULT_TIMEOUT = 60000;
const ACTIVE_USER_KEY = 'active_user';
let sharedInstance = null;

class ActiveUserStorage {
  constructor() {
    this.memory = new MemoryCache();
  }

  get(key) {
    if (!isString(key)) {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    try {
      return JSON.parse(this.memory.get(key));
    } catch (e) {
      return null;
    }
  }

  set(key, value) {
    if (!isString(key)) {
      throw new KinveyError('ActiveUserStorage key must be a string.');
    }

    if (isDefined(value)) {
      this.memory.set(key, JSON.stringify(value));
    } else {
      this.memory.delete(key);
    }

    return value;
  }
}

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
export class Client {
  /**
   * Creates a new instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.instanceId='<my-subdomain>']              Custom subdomain for Kinvey API and MIC requests.
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Deprecated: Use the instanceID property instead. Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Deprecated: Use the instanceID property instead. Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                      An instance of the Client class.
   *
   * @example
   * var client = new Kinvey.Client({
   *   appKey: '<appKey>',
   *   appSecret: '<appSecret>'
   * });
   */

  constructor(config = {}) {
    let apiHostname = 'https://baas.kinvey.com';
    let micHostname = 'https://auth.kinvey.com';

    if (config.instanceId) {
      const { instanceId } = config;

      if (!isString(instanceId)) {
        throw new KinveyError('Instance ID must be a string.');
      }

      apiHostname = `https://${instanceId}-baas.kinvey.com`;
      micHostname = `https://${instanceId}-auth.kinvey.com`;
    } else {
      if (isString(config.apiHostname)) {
        apiHostname = /^https?:\/\//i.test(config.apiHostname) ? config.apiHostname : `https://${config.apiHostname}`;
      }

      if (isString(config.micHostname)) {
        micHostname = /^https?:\/\//i.test(config.micHostname) ? config.micHostname : `https://${config.micHostname}`;
      }
    }

    const apiHostnameParsed = url.parse(apiHostname);
    const micHostnameParsed = url.parse(micHostname);

    /**
     * @type {string}
     */
    this.deviceId = uuidv4();

    /**
     * @type {string}
     */
    this.apiProtocol = apiHostnameParsed.protocol;

    /**
     * @type {string}
     */
    this.apiHost = apiHostnameParsed.host;

    /**
     * @type {string}
     */
    this.micProtocol = micHostnameParsed.protocol;

    /**
     * @type {string}
     */
    this.micHost = micHostnameParsed.host;

    /**
     * @type {?string}
     */
    this.appKey = config.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = config.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = config.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = config.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = config.appVersion;

    /**
     * @type {?number}
     */
    this.defaultTimeout = isNumber(config.defaultTimeout) && config.defaultTimeout >= 0 ? config.defaultTimeout : DEFAULT_TIMEOUT;

    /**
     * @private
     */
    this.activeUserStorage = new ActiveUserStorage();

    this.storage = config.storage || StorageProvider.Memory;
  }

  /**
   * Get the active user.
   */
  getActiveUser() {
    return this.activeUserStorage.get(`${this.appKey}.${ACTIVE_USER_KEY}`);
  }

  /**
   * Set the active user
   */
  setActiveUser(activeUser) {
    return this.activeUserStorage.set(`${this.appKey}.${ACTIVE_USER_KEY}`, activeUser);
  }

  /**
   * API host name used for Kinvey API requests.
   */
  get apiHostname() {
    return url.format({
      protocol: this.apiProtocol,
      host: this.apiHost
    });
  }

  /**
   * Mobile Identity Connect host name used for MIC requests.
   */
  get micHostname() {
    return url.format({
      protocol: this.micProtocol,
      host: this.micHost
    });
  }

  /**
   * The version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   */
  get appVersion() {
    return this._appVersion;
  }

  /**
   * Set the version of your app. It will sent with Kinvey API requests
   * using the X-Kinvey-Api-Version header.
   *
   * @param  {String} appVersion  App version.
   */
  set appVersion(appVersion) {
    if (appVersion && !isString(appVersion)) {
      appVersion = String(appVersion);
    }

    this._appVersion = appVersion;
  }

  get defaultTimeout() {
    return this._defaultTimeout;
  }

  set defaultTimeout(timeout) {
    timeout = parseInt(timeout, 10);

    if (isNumber(timeout) === false || isNaN(timeout)) {
      throw new KinveyError('Invalid timeout. Timeout must be a number.');
    }

    if (timeout < 0) {
      Log.info(`Default timeout is less than 0. Setting default timeout to ${this.defaultTimeout}ms.`);
      timeout = this.defaultTimeout;
    }

    this._defaultTimeout = timeout;
  }

  get storage() {
    return this._storage;
  }

  set storage(value) {
    if (!isValidStorageProviderValue(value)) {
      throw new KinveyError('Please provide a valid set of supported storage providers for this platform');
    }

    this._storage = value;
  }

  /**
   * Returns an object containing all the information for this Client.
   *
   * @return {Object} Object
   */
  toPlainObject() {
    return {
      deviceId: this.deviceId,
      apiHostname: this.apiHostname,
      apiProtocol: this.apiProtocol,
      apiHost: this.apiHost,
      micHostname: this.micHostname,
      micProtocol: this.micProtocol,
      micHost: this.micHost,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey,
      appVersion: this.appVersion,
      storage: this.storage
    };
  }

  /**
   * Initializes the Client class by creating a new instance of the
   * Client class and storing it as a shared instance. The returned promise
   * resolves with the shared instance of the Client class.
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
   */
  static initialize() {
    throw new KinveyError('Please use Client.init().');
  }

  /**
   * Initializes the Client class by creating a new instance of the
   * Client class and storing it as a shared instance. The returned promise
   * resolves with the shared instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
   * @param {string}    [options.appKey]                                   App Key
   * @param {string}    [options.appSecret]                                App Secret
   * @param {string}    [options.masterSecret]                             App Master Secret
   * @param {string}    [options.encryptionKey]                            App Encryption Key
   * @param {string}    [options.appVersion]                               App Version
   * @return {Client}                                                     A promise.
   */
  static init(config) {
    sharedInstance = new Client(config);
    return sharedInstance;
  }

  /**
   * Returns the shared instance of the Client class used by the SDK.
   *
   * @throws {KinveyError} If a shared instance does not exist.
   *
   * @return {Client} The shared instance.
   *
   * @example
   * var client = Kinvey.Client.sharedInstance();
   */
  static sharedInstance() {
    if (isDefined(sharedInstance) === false) {
      throw new KinveyError('You have not initialized the library. ' +
        'Please call Kinvey.init() to initialize the library.');
    }

    return sharedInstance;
  }
}

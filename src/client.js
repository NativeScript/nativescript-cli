import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';

import { KinveyError } from 'src/errors';
import { Log, isDefined } from 'src/utils';
import { ActiveUserHelper } from 'src/entity/src/activeUserHelper';

const DEFAULT_TIMEOUT = 60000;
let sharedInstance = null;

/**
 * The Client class stores information about your application on the Kinvey platform. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
export default class Client {
  /**
   * Creates a new instance of the Client class.
   *
   * @param {Object}    options                                            Options
   * @param {string}    [options.apiHostname='https://baas.kinvey.com']    Host name used for Kinvey API requests
   * @param {string}    [options.micHostname='https://auth.kinvey.com']    Host name used for Kinvey MIC requests
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
  constructor(options = {}) {
    options = assign({
      apiHostname: 'https://baas.kinvey.com',
      micHostname: 'https://auth.kinvey.com',
      liveServiceHostname: 'https://kls.kinvey.com',
      defaultTimeout: DEFAULT_TIMEOUT
    }, options);

    if (options.apiHostname && isString(options.apiHostname)) {
      let apiHostname = options.apiHostname;

      if (/^https?:\/\//i.test(apiHostname) === false) {
        apiHostname = `https://${apiHostname}`;
      }

      const apiHostnameParsed = url.parse(apiHostname);

      /**
       * @type {string}
       */
      this.apiProtocol = apiHostnameParsed.protocol;

      /**
       * @type {string}
       */
      this.apiHost = apiHostnameParsed.host;
    }

    if (options.micHostname && isString(options.micHostname)) {
      let micHostname = options.micHostname;

      if (/^https?:\/\//i.test(micHostname) === false) {
        micHostname = `https://${micHostname}`;
      }

      const micHostnameParsed = url.parse(micHostname);

      /**
       * @type {string}
       */
      this.micProtocol = micHostnameParsed.protocol;

      /**
       * @type {string}
       */
      this.micHost = micHostnameParsed.host;
    }

    if (options.liveServiceHostname && isString(options.liveServiceHostname)) {
      let liveServiceHostname = options.liveServiceHostname;

      if (/^https?:\/\//i.test(liveServiceHostname) === false) {
        liveServiceHostname = `https://${liveServiceHostname}`;
      }

      const liveServiceHostnameParsed = url.parse(liveServiceHostname);

      /**
       * @type {string}
       */
      this.liveServiceProtocol = liveServiceHostnameParsed.protocol;

      /**
       * @type {string}
       */
      this.liveServiceHost = liveServiceHostnameParsed.host;
    }

    /**
     * @type {?string}
     */
    this.appKey = options.appKey;

    /**
     * @type {?string}
     */
    this.appSecret = options.appSecret;

    /**
     * @type {?string}
     */
    this.masterSecret = options.masterSecret;

    /**
     * @type {?string}
     */
    this.encryptionKey = options.encryptionKey;

    /**
     * @type {?string}
     */
    this.appVersion = options.appVersion;

    /**
     * @type {?number}
     */
    this.defaultTimeout = isNumber(options.defaultTimeout) && options.defaultTimeout >= 0 ? options.defaultTimeout : DEFAULT_TIMEOUT;
  }

  /**
   * Get the active user.
   */
  get activeUser() {
    return ActiveUserHelper.get(this);
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
   * Live Service host name used for streaming data.
   */
  get liveServiceHostname() {
    return url.format({
      protocol: this.liveServiceProtocol,
      host: this.liveServiceHost
    });
  }

  /**
   * Returns an object containing all the information for this Client.
   *
   * @return {Object} Object
   */
  toPlainObject() {
    return {
      apiHostname: this.apiHostname,
      apiProtocol: this.apiProtocol,
      apiHost: this.apiHost,
      micHostname: this.micHostname,
      micProtocol: this.micProtocol,
      micHost: this.micHost,
      liveServiceHostname: this.liveServiceHostname,
      liveServiceHost: this.liveServiceHost,
      liveServiceProtocol: this.liveServiceProtocol,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey,
      appVersion: this.appVersion
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
   * @return {Promise}                                                     A promise.
   */
  static init(options) {
    const client = new Client(options);
    sharedInstance = client;
    return client;
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

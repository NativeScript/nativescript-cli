const KinveyError = require('./errors').KinveyError;
const url = require('url');
const clone = require('lodash/lang/clone');
const sharedInstanceSymbol = Symbol();

/**
 * The Client class stores information regarding your application. You can create mutiple clients
 * to send requests to different environments on the Kinvey platform.
 */
class Client {
  /**
   * Create a new instance of the Client class. An `options.appKey` must be provided along with
   * either and `options.appSecret` or `options.masterSecret`.
   *
   * @param {Object} options - Options
   * @param {string} options.appId - My app's id
   * @param {string} [options.appSecret] - My app's secret
   * @param {string} [options.masterSecret] - My app's master secret
   * @param {string} [options.encryptionKey] - My app's encryption key
   * @param {string} [options.apiUrl] - The url to use to send network requests.
   *
   * @throws {KinveyError}  If an `options.appId` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @example
   * var client = new Client({
   *   appId: 'appId',
   *   appSecret: 'appSecret'
   * });
   */
  constructor(options) {
    options = options || {};
    const apiProtocol = process.env.KINVEY_API_PROTOCOL || 'https:';
    const apiHost = process.env.KINVEY_API_HOST || 'baas.kinvey.com';
    let apiUrl;
    let apiUrlComponents;

    if (!options.appId && !options.appKey) {
      throw new KinveyError('No App Id was provided. ' +
        'Unable to create a new Client without an App Id.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. ' +
        'Unable to create a new Client without an App Key.');
    }

    // Parse the API url
    apiUrl = options.apiUrl || `${apiProtocol}//${apiHost}`;
    apiUrlComponents = url.parse(apiUrl);

    // Check the protocol of the apiUrl
    if (apiUrlComponents.protocol.indexOf(apiProtocol) !== 0 && options.allowHttp === false) {
      apiUrlComponents.protocol = apiProtocol;
    }

    /**
     * @type {string}
     */
    this.apiProtocol = apiUrlComponents.protocol;

    /**
     * @type {string}
     */
    this.apiHost = apiUrlComponents.host;

    /**
     * @type {string}
     */
    this.appId = options.appId || options.appKey;

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
  }

  /**
   * @type {string}
   */
  get apiUrl() {
    return url.format({
      protocol: this.apiProtocol,
      host: this.apiHost
    });
  }

  /**
   * Returns an object containing all the information for this Kinvey instance.
   *
   * @return {Object} JSON
   */
  toJSON() {
    const json = {
      apiProtocol: this.apiProtocol,
      apiHost: this.apiHost,
      appId: this.appId,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey
    };

    return clone(json);
  }

  /**
   * Initializes the library by creating a new instance of the
   * Client class and storing it as a shared instance.
   *
   * @param {Object} options - Options
   * @param {string} options.appId - My app's id
   * @param {string} [options.appSecret] - My app's secret
   * @param {string} [options.masterSecret] - My app's master secret
   * @param {string} [options.encryptionKey] - My app's encryption key
   * @param {string} [options.apiUrl] - The url to send Kinvey API requests.
   *
   * @throws {KinveyError}  If an `options.appId` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @return {Client}  An instance of Client.
   *
   * @example
   * var sharedInstance = Client.init({
   *   appId: 'appId',
   *   appSecret: 'appSecret'
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

module.exports = Client;

import url from 'url';
import clone from 'lodash/lang/clone';
import KinveyError from './core/errors/error';

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
   * @param {string} options.appKey - My app's key
   * @param {string} [options.appSecret] - My app's secret
   * @param {string} [options.masterSecret] - My app's master secret
   * @param {string} [options.encryptionKey] - My app's encryption key
   * @param {string} [options.apiUrl] - The url to use to send network requests.
   *
   * @throws {KinveyError}  If an `options.appkey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @example
   * var client = new Client({
   *   appKey: 'appKey',
   *   appSecret: 'appSecret'
   * });
   */
  constructor(options = {}) {
    const apiProtocol = process.env.KINVEY_API_PROTOCOL || 'https';
    const apiHostname = process.env.KINVEY_API_HOSTNAME || 'baas.kinvey.com';
    let apiUrl;
    let apiUrlComponents;

    if (!options.appKey) {
      throw new KinveyError('No App Key was provided. Unable to create a new Client without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. Unable to create a new Client without an App Key.');
    }

    // Parse the API url
    apiUrl = options.apiUrl || `${apiProtocol}://${apiHostname}`;
    apiUrlComponents = url.parse(apiUrl);

    // Check the protocol of the apiUrl
    if (apiUrlComponents.protocol.indexOf(apiProtocol) !== 0 && options.dev === false) {
      apiUrlComponents.protocol = apiProtocol;
    }

    /**
     * @type {string}
     */
    this.apiProtocol = apiUrlComponents.protocol;

    /**
     * @type {string}
     */
    this.apiHostname = apiUrlComponents.hostname;

    /**
     * @type {string}
     */
    this.appKey = options.appKey;

    /**
     * @type {string|undefined}
     */
    this.appSecret = options.appSecret || undefined;

    /**
     * @type {string|undefined}
     */
    this.masterSecret = options.masterSecret || undefined;

    /**
     * @type {string|undefined}
     */
    this.encryptionKey = options.encryptionKey || undefined;
  }

  /**
   * @type {string}
   */
  get apiUrl() {
    return url.format({
      protocol: this.apiProtocol,
      hostname: this.apiHostname
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
      apiHostname: this.apiHostname,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey
    };

    return clone(json);
  }
}

export default Client;

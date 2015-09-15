import url from 'url';
import clone from 'lodash/lang/clone';
import KinveyError from './core/errors/error';
const sharedInstanceSymbol = Symbol();

/**
 * The Kinvey class stores information regarding your application. You can create mutiple instances
 * of Kinvey to send requests to different environments on the Kinvey platform.
 */
class Kinvey {
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
   * @type {string}
   */
  get micApiUrl() {
    return url.format({
      protocol: this.micApiProtocol,
      hostname: this.micApiHostname
    });
  }

  /**
   * Create a new instance of the Kinvey class. An `options.appKey` must be provided along with
   * either and `options.appSecret` or `options.masterSecret` otherwise an error will be
   * thrown.
   *
   * @param {Object} options - Options
   * @param {string} options.appKey - My app's key
   * @param {string} [options.appSecret] - My app's secret
   * @param {string} [options.masterSecret] - My app's master secret
   * @param {string} [options.encryptionKey] - My app's encryption key
   * @param {string} [options.apiUrl] - The url to send Kinvey API requests.
   * @param {number} [options.apiVersion] - The version of the Kinvey API to use.
   * @param {string} [options.micApiUrl] - The url to use to connect with Mobile Identity Connect (MIC).
   * @param {number} [options.micApiVersion] - The version of Mobile Identity Connect (MIC) to use.
   *
   * @throws {KinveyError}  If an `options.appkey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @example
   * var client = new Kinvey({
   *   appKey: 'appKey',
   *   appSecret: 'appSecret'
   * });
   */
  constructor(options = {}) {
    const apiProtocol = process.env.KINVEY_API_PROTOCOL || 'https';
    const apiHostname = process.env.KINVEY_API_HOSTNAME || 'baas.kinvey.com';
    const micApiProtocol = process.env.KINVEY_MIC_API_PROTOCOL || 'https';
    const micApiHostname = process.env.KINVEY_MIC_API_HOSTNAME || 'auth.kinvey.com';
    const micApiVersion = process.env.KINVEY_MIC_API_VERSION || undefined;
    const apiVersion = process.env.KINVEY_API_VERSION || 3;
    let apiUrl;
    let apiUrlComponents;
    let micApiUrl;
    let micApiUrlComponents;

    if (!options.appKey) {
      throw new KinveyError('No App Key was provided. Unable to initialize the Kinvey library without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new KinveyError('No App Secret or Master Secret was provided. Unable to initialize the Kinvey library without an App Secret or Master Secret.');
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
     * @type {number}
     */
    this.apiVersion = options.apiVersion || apiVersion;

    // Parse the MIC API url
    micApiUrl = options.micApiUrl || `${micApiProtocol}://${micApiHostname}`;
    micApiUrlComponents = url.parse(micApiUrl);

    // Check the protocol of the micApiUrl
    if (micApiUrlComponents.protocol.indexOf(micApiProtocol) !== 0 && options.dev === false) {
      micApiUrlComponents.protocol = micApiProtocol;
    }

    /**
     * @type {string}
     */
    this.micApiProtocol = micApiUrlComponents.protocol;

    /**
     * @type {string}
     */
    this.micApiHostname = micApiUrlComponents.hostname;

    /**
     * @type {number}
     */
    this.micApiVersion = options.micApiVersion || micApiVersion;

    // // Set the Client App Version
    // if (options.clientAppVersion != null) {
    //   Kinvey.ClientAppVersion.setVersion(options.clientAppVersion);
    // }

    // // Set the custom request properties
    // if (options.customRequestProperties != null) {
    //   Kinvey.CustomRequestProperties.setProperties(options.customRequestProperties);
    // }

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
   * Returns an object containing all the information for this Kinvey instance.
   *
   * @return {Object} JSON
   */
  toJSON() {
    const json = {
      apiProtocol: this.apiProtocol,
      apiHostname: this.apiHostname,
      apiVersion: this.apiVersion,
      micApiProtocol: this.micApiProtocol,
      micApiHostname: this.micApiHostname,
      micApiVersion: this.micApiVersion,
      appKey: this.appKey,
      appSecret: this.appSecret,
      masterSecret: this.masterSecret,
      encryptionKey: this.encryptionKey
    };

    return clone(json);
  }

  /**
   * Initializes the library by creating a new instance of the Kinvey class and storing it as a shared instance.
   *
   * @param {Object} options - Options
   * @param {string} options.appKey - My app's key
   * @param {string} [options.appSecret] - My app's secret
   * @param {string} [options.masterSecret] - My app's master secret
   * @param {string} [options.encryptionKey] - My app's encryption key
   * @param {string} [options.apiUrl] - The url to send Kinvey API requests.
   * @param {number} [options.apiVersion] - The version of the Kinvey API to use.
   * @param {string} [options.micApiUrl] - The url to use to connect with Mobile Identity Connect (MIC).
   * @param {number} [options.micApiVersion] - The version of Mobile Identity Connect (MIC) to use.
   *
   * @throws {KinveyError}  If an `options.appkey` is not provided.
   * @throws {KinveyError}  If neither an `options.appSecret` or `options.masterSecret` is provided.
   *
   * @return {Kinvey}  An instance of Kinvey.
   *
   * @example
   * var sharedInstance = Kinvey.init({
   *   appKey: 'appKey',
   *   appSecret: 'appSecret'
   * });
   */
  static init(options = {}) {
    const kinvey = new Kinvey(options);
    Kinvey[sharedInstanceSymbol] = kinvey;
    return kinvey;
  }

  /**
   * Returns the shared Kinvey instance used by the library.
   *
   * @throws {KinveyError} If `Kinvey.init()` has not been called.
   *
   * @return {Kinvey} The shared instance.
   */
  static sharedInstance() {
    const instance = Kinvey[sharedInstanceSymbol];

    if (!instance) {
      throw new KinveyError('You have not initialized the library. Please call `Kinvey.init()` before accessing the shared instance.');
    }

    return instance;
  }
}

export default Kinvey;

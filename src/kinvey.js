import CoreObject from './core/object';
import utils from './core/utils';
import url from 'url';
import User from './core/user';
const instanceSymbol = Symbol();

class Kinvey extends CoreObject {
  constructor() {
    super();

    this.apiProtocol = process.env.API_PROTOCOL || 'https';
    this.apiHostname = process.env.API_HOSTNAME || 'baas.kinvey.com';
    this.apiVersion = process.env.API_VERSION || 3;
  }

  get activeUser() {
    return User.current;
  }

  set activeUser(user) {
    User.current = user;
  }

  static init(options = {}) {
    let kinvey = new Kinvey();
    let apiUrl;
    let apiUrlComponents;
    let error;

    if (!utils.isDefined(options.appKey)) {
      error = new Kinvey.Error('No App Key was provided. Unable to initialize Kinvey without an App Key.');
      throw error;
    }

    if (!utils.isDefined(options.appSecret) && !utils.isDefined(options.masterSecret)) {
      error = new Kinvey.Error('No App Secret or Master Secret was provided. Unable to initialize Kinvey without an App Secret or Master Secret.');
      throw error;
    }

    // Parse the API url
    apiUrl = options.apiUrl || `${kinvey.apiProtocol}://${kinvey.apiHostname}`;
    apiUrlComponents = url.parse(apiUrl);

    // Make sure the protocol of the apiUrl is using https
    if (apiUrlComponents.protocol.indexOf('https') !== 0) {
      apiUrlComponents.protocol = kinvey.apiProtocol;
    }

    // Set the API protocol and hostname
    kinvey.apiProtocol = apiUrlComponents.protocol;
    kinvey.apiHostname = apiUrlComponents.hostname;

    // // Set the MIC host name
    // Kinvey.MICHostName = options.micHostName || Kinvey.MICHostName;

    // // Check if Kinvey.MICHostName uses https protocol
    // if (Kinvey.MICHostName.indexOf('https://') !== 0) {
    //   error = new Kinvey.Error('Kinvey requires https as the protocol when setting' +
    //                          ' Kinvey.MICHostName, instead found the protocol ' +
    //                          Kinvey.MICHostName.substring(0, Kinvey.MICHostName.indexOf(':/')) +
    //                          ' in Kinvey.MICHostName: ' + Kinvey.MICHostName);
    //   return reject(error);
    // }

    // // Set the Client App Version
    // if (options.clientAppVersion != null) {
    //   Kinvey.ClientAppVersion.setVersion(options.clientAppVersion);
    // }

    // // Set the custom request properties
    // if (options.customRequestProperties != null) {
    //   Kinvey.CustomRequestProperties.setProperties(options.customRequestProperties);
    // }

    // Save credentials.
    kinvey.appKey = options.appKey;
    kinvey.appSecret = options.appSecret || undefined;
    kinvey.masterSecret = options.masterSecret || undefined;

    // Set the encryption key.
    kinvey.encryptionKey = options.encryptionKey || undefined;

    // Store the instance
    this[instanceSymbol] = kinvey;

    // Return the instance
    return kinvey;
  }

  static instance() {
    let instance = this[instanceSymbol];

    if (!utils.isDefined(instance)) {
      instance = new Kinvey();
      this[instanceSymbol] = instance;
    }

    return instance;
  }
}

export default Kinvey;

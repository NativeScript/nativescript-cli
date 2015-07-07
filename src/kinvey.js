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
    this.micApiProtocol = process.env.MIC_API_PROTOCOL || 'https';
    this.micApiHostname = process.env.MIC_API_HOSTNAME || '';
    this.micApiVersion = process.env.MIC_API_VERSION;
    this.apiVersion = process.env.API_VERSION || 3;
  }

  get activeUser() {
    return User.active;
  }

  set activeUser(user) {
    User.active = user;
  }

  static init(options = {}) {
    let kinvey = new Kinvey();
    let apiUrl;
    let apiUrlComponents;
    let micApiUrl;
    let micApiUrlComponents;
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

    // Check the protocol of the apiUrl
    if (apiUrlComponents.protocol.indexOf(kinvey.apiProtocol) !== 0 && options.dev === false) {
      apiUrlComponents.protocol = kinvey.apiProtocol;
    }

    // Set the API protocol and hostname
    kinvey.apiProtocol = apiUrlComponents.protocol;
    kinvey.apiHostname = apiUrlComponents.hostname;

    // Set the MIC host name
    kinvey.micHostName = options.micHostName || Kinvey.MICHostName;

    // Parse the MIC API url
    micApiUrl = options.micApiUrl || `${kinvey.micApiProtocol}://${kinvey.micApiHostname}`;
    micApiUrlComponents = url.parse(micApiUrl);

    // Check the protocol of the micApiUrl
    if (micApiUrlComponents.protocol.indexOf(kinvey.micApiProtocol) !== 0 && options.dev === false) {
      micApiUrlComponents.protocol = kinvey.micApiProtocol;
    }

    // Set the MIC API protocol and hostname
    kinvey.micApiProtocol = micApiUrlComponents.protocol;
    kinvey.micApiHostname = micApiUrlComponents.hostname;

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
    Kinvey[instanceSymbol] = kinvey;

    // Return the instance
    return kinvey;
  }

  static instance() {
    let instance = Kinvey[instanceSymbol];

    if (!utils.isDefined(instance)) {
      instance = new Kinvey();
      Kinvey[instanceSymbol] = instance;
    }

    return instance;
  }
}

export default Kinvey;

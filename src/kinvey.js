import CoreObject from './core/object';
<<<<<<< Updated upstream
import {isDefined} from './core/utils';
import url from 'url';
import User from './core/user';
const instanceSymbol = Symbol();
const cacheEnabledSymbol = Symbol();

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
=======
import {isDefined} from './utils';
import url from 'url';
import User from './core/user';
const shareSettingsSymbol = Symbol();

class Kinvey extends CoreObject {
  static get appKey() {
    return Kinvey[shareSettingsSymbol].appKey;
  }

  static get appSecret() {
    return Kinvey[shareSettingsSymbol].appSecret;
  }

  static get masterSecret() {
    return Kinvey[shareSettingsSymbol].masterSecret;
  }

  static get encryptionKey() {
    return Kinvey[shareSettingsSymbol].encryptionKey;
  }

  static get apiProtocol() {
    return Kinvey[shareSettingsSymbol].apiProtocol;
  }

  static get apiHostname() {
    return Kinvey[shareSettingsSymbol].apiHostname;
  }

  static get apiUrl() {
    return url.format({
      protocol: Kinvey.apiProtocol,
      hostname: Kinvey.apiHostname
    });
  }

  static get apiVersion() {
    return Kinvey[shareSettingsSymbol].apiVersion;
  }

  static get micApiProtocol() {
    return Kinvey[shareSettingsSymbol].micApiProtocol;
  }

  static get micApiHostname() {
    return Kinvey[shareSettingsSymbol].micApiHostname;
  }

  static get micApiVersion() {
    return Kinvey[shareSettingsSymbol].micApiVersion;
  }

  static init(options = {}) {
    const sharedInfo = Kinvey[shareSettingsSymbol];
>>>>>>> Stashed changes
    let apiUrl;
    let apiUrlComponents;
    let micApiUrl;
    let micApiUrlComponents;

    if (!isDefined(options.appKey)) {
      throw new Error('No App Key was provided. Unable to initialize Kinvey without an App Key.');
    }

    if (!isDefined(options.appSecret) && !isDefined(options.masterSecret)) {
      throw new Error('No App Secret or Master Secret was provided. Unable to initialize Kinvey without an App Secret or Master Secret.');
    }

    // Parse the API url
<<<<<<< Updated upstream
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
=======
    apiUrl = options.apiUrl || `${sharedInfo.apiProtocol}://${sharedInfo.apiHostname}`;
    apiUrlComponents = url.parse(apiUrl);

    // Check the protocol of the apiUrl
    if (apiUrlComponents.protocol.indexOf(sharedInfo.apiProtocol) !== 0 && options.dev === false) {
      apiUrlComponents.protocol = sharedInfo.apiProtocol;
    }

    // Set the API protocol and hostname
    sharedInfo.apiProtocol = apiUrlComponents.protocol;
    sharedInfo.apiHostname = apiUrlComponents.hostname;

    // Set the MIC host name
    sharedInfo.micHostName = options.micHostName || sharedInfo.MICHostName;

    // Parse the MIC API url
    micApiUrl = options.micApiUrl || `${sharedInfo.micApiProtocol}://${sharedInfo.micApiHostname}`;
    micApiUrlComponents = url.parse(micApiUrl);

    // Check the protocol of the micApiUrl
    if (micApiUrlComponents.protocol.indexOf(sharedInfo.micApiProtocol) !== 0 && options.dev === false) {
      micApiUrlComponents.protocol = sharedInfo.micApiProtocol;
    }

    // Set the MIC API protocol and hostname
    sharedInfo.micApiProtocol = micApiUrlComponents.protocol;
    sharedInfo.micApiHostname = micApiUrlComponents.hostname;
>>>>>>> Stashed changes

    // // Set the Client App Version
    // if (options.clientAppVersion != null) {
    //   Kinvey.ClientAppVersion.setVersion(options.clientAppVersion);
    // }

    // // Set the custom request properties
    // if (options.customRequestProperties != null) {
    //   Kinvey.CustomRequestProperties.setProperties(options.customRequestProperties);
    // }

    // Save credentials.
<<<<<<< Updated upstream
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

  static isCacheEnabled() {
    return Kinvey[cacheEnabledSymbol] === true ? true : false;
  }

  static enabledCache() {
    Kinvey[cacheEnabledSymbol] = true;
  }

  static disableCache() {
    Kinvey[cacheEnabledSymbol] = false;
  }

  static instance() {
    let instance = Kinvey[instanceSymbol];

    if (!isDefined(instance)) {
      instance = new Kinvey();
      Kinvey[instanceSymbol] = instance;
    }

    return instance;
  }
}

=======
    sharedInfo.appKey = options.appKey;
    sharedInfo.appSecret = options.appSecret || undefined;
    sharedInfo.masterSecret = options.masterSecret || undefined;

    // Set the encryption key.
    sharedInfo.encryptionKey = options.encryptionKey || undefined;

    // Store the shared info
    Kinvey[shareSettingsSymbol] = sharedInfo;
  }

  static getActiveUser() {
    return User.getActive();
  }

  static setActiveUser(user) {
    User.setActive(user);
  }

  static isCacheEnabled() {
    return Kinvey[shareSettingsSymbol].cacheEnabled === true ? true : false;
  }

  static enabledCache() {
    Kinvey[shareSettingsSymbol].cacheEnabled = true;
  }

  static disableCache() {
    Kinvey[shareSettingsSymbol].cacheEnabled = false;
  }
}

// Default settings
Kinvey[shareSettingsSymbol] = {
  appKey: undefined,
  appSecret: undefined,
  masterSecret: undefined,
  encryptionKey: undefined,
  apiProtocol: process.env.KINVEY_API_PROTOCOL || 'https',
  apiHostname: process.env.KINVEY_API_HOSTNAME || 'baas.kinvey.com',
  micApiProtocol: process.env.KINVEY_MIC_API_PROTOCOL || 'https',
  micApiHostname: process.env.KINVEY_MIC_API_HOSTNAME || '',
  micApiVersion: process.env.KINVEY_MIC_API_VERSION || undefined,
  apiVersion: process.env.KINVEY_API_VERSION || 3,
  cacheEnabled: false
};

>>>>>>> Stashed changes
export default Kinvey;

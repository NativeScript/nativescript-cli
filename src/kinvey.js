import url from 'url';
const sharedInstanceSymbol = Symbol();

class Kinvey {
  get apiUrl() {
    return url.format({
      protocol: this.apiProtocol,
      hostname: this.apiHostname
    });
  }

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
      throw new Error('No App Key was provided. Unable to initialize Kinvey without an App Key.');
    }

    if (!options.appSecret && !options.masterSecret) {
      throw new Error('No App Secret or Master Secret was provided. Unable to initialize Kinvey without an App Secret or Master Secret.');
    }

    // Parse the API url
    apiUrl = options.apiUrl || `${apiProtocol}://${apiHostname}`;
    apiUrlComponents = url.parse(apiUrl);

    // Check the protocol of the apiUrl
    if (apiUrlComponents.protocol.indexOf(apiProtocol) !== 0 && options.dev === false) {
      apiUrlComponents.protocol = apiProtocol;
    }

    // Set the API protocol and hostname
    this.apiProtocol = apiUrlComponents.protocol;
    this.apiHostname = apiUrlComponents.hostname;
    this.apiVersion = options.apiVersion || apiVersion;

    // Parse the MIC API url
    micApiUrl = options.micApiUrl || `${micApiProtocol}://${micApiHostname}`;
    micApiUrlComponents = url.parse(micApiUrl);

    // Check the protocol of the micApiUrl
    if (micApiUrlComponents.protocol.indexOf(micApiProtocol) !== 0 && options.dev === false) {
      micApiUrlComponents.protocol = micApiProtocol;
    }

    // Set the MIC API protocol and hostname
    this.micApiProtocol = micApiUrlComponents.protocol;
    this.micApiHostname = micApiUrlComponents.hostname;
    this.micApiVersion = options.micApiVersion || micApiVersion;

    // // Set the Client App Version
    // if (options.clientAppVersion != null) {
    //   Kinvey.ClientAppVersion.setVersion(options.clientAppVersion);
    // }

    // // Set the custom request properties
    // if (options.customRequestProperties != null) {
    //   Kinvey.CustomRequestProperties.setProperties(options.customRequestProperties);
    // }

    // Save credentials.
    this.appKey = options.appKey;
    this.appSecret = options.appSecret || undefined;
    this.masterSecret = options.masterSecret || undefined;

    // Set the encryption key.
    this.encryptionKey = options.encryptionKey || undefined;
  }

  toJSON() {
    return {
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
  }

  static init(options = {}) {
    const kinvey = new Kinvey(options);
    Kinvey[sharedInstanceSymbol] = kinvey;
    return kinvey;
  }

  static sharedInstance() {
    const instance = Kinvey[sharedInstanceSymbol];

    if (!instance) {
      throw new Error('No shared instance has been created. Please call `Kinvey.init()` to create the shared instance.');
    }

    return instance;
  }
}

export default Kinvey;

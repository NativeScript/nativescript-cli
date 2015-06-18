import utils from './core/utils';
import url from 'url';
import Session from './core/session';

let Kinvey = {
  apiProtocol: '/* @echo API_PROTOCOL */',
  apiHostname: '/* @echo API_HOSTNAME */',
  appKey: undefined,
  appSecret: undefined,
  masterSecret: undefined,
  encryptionKey: undefined
};

Kinvey.init = (options) => {
  let apiUrl;
  let apiUrlComponents;
  let error;

  return new Promise((resolve, reject) => {
    if (!utils.isDefined(options.appKey)) {
      error = new Kinvey.Error('No App Key was provided. Unable to initialize Kinvey without an App Key.');
      return reject(error);
    }
    if (!utils.isDefined(options.appSecret) && !utils.isDefined(options.masterSecret)) {
      error = new Kinvey.Error('No App Secret or Master Secret was provided. Unable to initialize Kinvey without an App Secret or Master Secret.');
      return reject(error);
    }

    // Parse the API url
    apiUrl = options.apiUrl || `${Kinvey.apiProtocol}//${Kinvey.apiHostname}`;
    apiUrlComponents = url.parse(apiUrl);

    // Make sure the protocol of the apiUrl is using https
    if (apiUrlComponents.protocol.indexOf('https') !== 0) {
      apiUrlComponents.protocol = '/* @echo API_PROTOCOL */';
    }

    // Set the API protocol and hostname
    Kinvey.apiProtocol = apiUrlComponents.protocol;
    Kinvey.apiHostname = apiUrlComponents.hostname;

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
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret || undefined;
    Kinvey.masterSecret = options.masterSecret || undefined;

    // Set the encryption key.
    Kinvey.encryptionKey = options.encryptionKey || undefined;
  });
};

Kinvey.setActiveUser = (user) => {
  Session.current = user;
};

export default Kinvey;

import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { parse, format } from 'url';
import { formatKinveyUrl, KinveyRequest, RequestMethod, Auth } from 'kinvey-http';

const DEFAULT_TIMEOUT = 60000;
const APPDATA_NAMESPACE = 'appdata';

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function uuidv4() {
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

let internalConfig;

export function init(config) {
  const {
    appKey,
    appSecret,
    masterSecret,
    appVersion,
    instanceId,
    encryptionKey,
    defaultTimeout
  } = config;
  let apiHostname = 'https://baas.kinvey.com';
  let authHostname = 'https://auth.kinvey.com';

  if (instanceId) {
    if (!isString(instanceId)) {
      throw new Error('Instance ID must be a string.');
    }

    apiHostname = `https://${instanceId}-baas.kinvey.com`;
    authHostname = `https://${instanceId}-auth.kinvey.com`;
  } else {
    if (isString(config.apiHostname)) {
      apiHostname = /^https?:\/\//i.test(config.apiHostname) ? config.apiHostname : `https://${config.apiHostname}`;
    }

    if (isString(config.micHostname)) {
      authHostname = /^https?:\/\//i.test(config.micHostname) ? config.micHostname : `https://${config.micHostname}`;
    }
  }

  if (!isString(appKey)) {
    throw new Error('An appKey is required and must be a string.');
  }

  if (!isString(appSecret)) {
    throw new Error('An appSecret is required and must be a string.');
  }

  if (appVersion && !isString(appVersion)) {
    throw new Error('An appVersion must be a string.');
  }

  if (encryptionKey && !isString(encryptionKey)) {
    throw new Error('An encryptionKey must be a string.');
  }

  if (defaultTimeout != null && (!isNumber(defaultTimeout) || defaultTimeout < 1)) {
    throw new Error('A defaultTimeout must be a number greater then 0.');
  }

  internalConfig = {
    appKey,
    appSecret,
    masterSecret,
    encryptionKey,
    appVersion,
    defaultTimeout: defaultTimeout || DEFAULT_TIMEOUT,
    auth: {
      protocol: parse(authHostname).protocol,
      host: parse(authHostname).host,
      hostname: authHostname
    },
    api: {
      protocol: parse(apiHostname).protocol,
      host: parse(apiHostname).host,
      hostname: apiHostname
    },
    device: {
      id: uuidv4()
    }
  };

  // TODO: change to return the config provided
  // Right now we are returning the whole config for
  // backwards compatibility
  return {
    deviceId: internalConfig.device.id,
    apiProtocol: internalConfig.api.protocol,
    apiHost: internalConfig.api.host,
    apiHostname: format({
      protocol: internalConfig.api.protocol,
      host: internalConfig.api.host
    }),
    micProtocol: internalConfig.auth.protocol,
    micHost: internalConfig.auth.host,
    micHostname: format({
      protocol: internalConfig.auth.protocol,
      host: internalConfig.auth.host
    }),
    appKey: internalConfig.appKey,
    appSecret: internalConfig.appSecret,
    masterSecret: internalConfig.masterSecret,
    encryptionKey: internalConfig.encryptionKey,
    appVersion: internalConfig.appVersion,
    defaultTimeout: internalConfig.defaultTimeout
  };
}

/**
 * @deprecated Please use init().
 */
export function initialize() {
  return Promise.reject(new Error('initialize() has been deprecated. Please use init().'));
}

/**
 * @private
 */
export function getConfig() {
  if (!internalConfig) {
    throw new Error('You have not initialized the Kinvey JavaScript SDK.');
  }

  return internalConfig;
}

/**
 * The version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @return {string} The version of your app.
 */
export function getAppVersion() {
  const config = getConfig();
  return config.appVersion;
}

/**
 * Set the version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @param  {string} appVersion  App version.
 */
export function setAppVersion(appVersion) {
  const config = getConfig();
  config.appVersion = appVersion;
}

/**
 * Pings the Kinvey API service. This can be used to check if you have configured the SDK correctly.
 *
 * @returns {Promise<Object>} The response from the ping request.
 *
 * @example
 * var promise = Kinvey.ping()
 *  .then(function(response) {
 *     console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
 *  })
 *  .catch(function(error) {
 *    console.log('Kinvey Ping Failed. Response: ' + error.description);
 *  });
 */
export async function ping() {
  const { appKey, api } = getConfig();
  const request = new KinveyRequest({
    method: RequestMethod.GET,
    headers: {
      Authorization: Auth.All
    },
    url: formatKinveyUrl(api.protocol, api.host, `/${APPDATA_NAMESPACE}/${appKey}`)
  });
  const response = await request.execute();
  return response.data;
}

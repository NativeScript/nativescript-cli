import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { parse } from 'url';

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

  if (instanceId && !isString(instanceId)) {
    throw new Error('Instance ID must be a string.');
  }

  const apiHostname = instanceId ? `https://${instanceId}-baas.kinvey.com` : 'https://baas.kinvey.com';
  const authHostname = instanceId ? `https://${instanceId}-auth.kinvey.com` : 'https://auth.kinvey.com';

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
    appVersion,
    api: {
      defaultTimeout: defaultTimeout || 60000,
      auth: {
        protocol: parse(authHostname).protocol,
        host: parse(authHostname).host,
        hostname: authHostname
      },
      baas: {
        protocol: parse(apiHostname).protocol,
        host: parse(apiHostname).host,
        hostname: apiHostname
      }
    },
    device: {
      id: uuidv4(),
      encryptionKey
    }
  };

  return config;
}

/**
 * @deprecated Please use init().
 */
export function initialize(config) {
  try {
    init(config);
    return Promise.resolve(null);
    // return Promise.resolve(User.getActiveUser(client));
  } catch (error) {
    return Promise.reject(error);
  }
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

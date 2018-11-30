import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { KinveyError } from 'kinvey-errors';
import { parse, format } from 'url';

const DEFAULT_TIMEOUT = 60000;

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function uuidv4() {
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

let internalConfig;

export function init(config = {}) {
  const {
    appKey,
    appSecret,
    masterSecret,
    appVersion,
    instanceId,
    encryptionKey
  } = config;
  let apiHostname = 'https://baas.kinvey.com';
  let authHostname = 'https://auth.kinvey.com';
  const defaultTimeout = isNumber(config.defaultTimeout) && config.defaultTimeout >= 0 ? config.defaultTimeout : DEFAULT_TIMEOUT

  if (instanceId) {
    if (!isString(instanceId)) {
      throw new KinveyError('Instance ID must be a string.');
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
    throw new KinveyError('An appKey is required and must be a string.');
  }

  if (!isString(appSecret) && !isString(masterSecret)) {
    throw new KinveyError('An appSecret is required and must be a string.');
  }

  if (appVersion && !isString(appVersion)) {
    throw new KinveyError('An appVersion must be a string.');
  }

  if (encryptionKey && !isString(encryptionKey)) {
    throw new KinveyError('An encryptionKey must be a string.');
  }

  // TODO: Add check in future
  // if (defaultTimeout != null && (!isNumber(defaultTimeout) || defaultTimeout < 1)) {
  //   throw new KineyError('A defaultTimeout must be a number greater then 0.');
  // }

  internalConfig = {
    appKey,
    appSecret,
    masterSecret,
    encryptionKey,
    appVersion,
    _appVersion: appVersion,
    defaultTimeout,
    _defaultTimeout: defaultTimeout,
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
  return Promise.reject(new KinveyError('initialize() has been deprecated. Please use init().'));
}

/**
 * @private
 */
export function getConfig() {
  if (!internalConfig) {
    throw new KinveyError('You have not initialized the Kinvey JavaScript SDK.');
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

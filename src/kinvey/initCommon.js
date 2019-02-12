import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { parse } from 'url';
import KinveyError from '../errors/kinvey';
import { set as setConfig } from './config';

const DEFAULT_TIMEOUT = 60000;

export default function init(config = {}) {
  const {
    appKey,
    appSecret,
    masterSecret,
    appVersion,
    instanceId,
    encryptionKey,
    storage
  } = config;
  const defaultTimeout = isNumber(config.defaultTimeout) && config.defaultTimeout >= 0 ? config.defaultTimeout : DEFAULT_TIMEOUT;
  let apiHostname = 'https://baas.kinvey.com';
  let authHostname = 'https://auth.kinvey.com';

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

  // Create the internal config
  const internalConfig = {
    appKey,
    appSecret,
    masterSecret,
    encryptionKey,
    appVersion,
    _appVersion: appVersion,
    defaultTimeout,
    _defaultTimeout: defaultTimeout,
    storage,
    apiProtocol: parse(apiHostname).protocol,
    apiHost: parse(apiHostname).host,
    apiHostname,
    authProtocol: parse(authHostname).protocol,
    authHost: parse(authHostname).host,
    authHostname,
    micProtocol: parse(authHostname).protocol,
    micHost: parse(authHostname).host,
    micHostname: authHostname
  };

  // Set the internal config
  setConfig(internalConfig);

  // Return the internal config
  return internalConfig;
}

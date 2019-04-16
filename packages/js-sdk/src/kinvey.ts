import isNumber = require('lodash/isNumber');
import { getConfig, ConfigKey } from './config';

export interface KinveyConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  defaultTimeout?: number;
  encryptionKey?: string;
}

export function getAppKey() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  return config.appKey;
}

export function getAppSecret() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  return config.appSecret;
}

export function getMasterSecret() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  return config.masterSecret;
}

export function getInstanceId() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  return config.instanceId;
}

export function getBaasProtocol() {
  return 'https';
}

export function getBaasHost() {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-baas.kinvey.com`;
  }

  return 'baas.kinvey.com';
}

export function getAuthProtocol() {
  return 'https';
}

export function getAuthHost() {
  const instanceId = getInstanceId();

  if (instanceId) {
    return `${instanceId}-auth.kinvey.com`;
  }

  return 'auth.kinvey.com';
}

export function getDefaultTimeout() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  if (isNumber(config.defaultTimeout)) {
    return config.defaultTimeout;
  }
  return 60000; // 1 minute
}

export function getEncryptionKey() {
  const config = getConfig<KinveyConfig>(ConfigKey.KinveyConfig);
  return config.encryptionKey;
}

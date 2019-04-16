import { format } from 'url';
import { ConfigKey, setConfig } from './config';
import { SessionStore, HttpAdapter, getAppVersion } from './http';
import {
  getAppKey,
  getAppSecret,
  getMasterSecret,
  getBaasProtocol,
  getBaasHost,
  getAuthProtocol,
  getAuthHost,
  getDefaultTimeout,
  getEncryptionKey,
  KinveyConfig
} from './kinvey';
import { Popup } from './user/mic/popup';
import { StorageAdapter } from './storage';

export interface Config {
  kinveyConfig: KinveyConfig;
  httpAdapter: HttpAdapter;
  sessionStore: SessionStore;
  popup: Popup,
  storageAdapter: StorageAdapter,
  pubnub: any
}

export function init(config: Config) {
  setConfig(ConfigKey.KinveyConfig, config.kinveyConfig);
  setConfig(ConfigKey.HttpAdapter, config.httpAdapter);
  setConfig(ConfigKey.SessionStore, config.sessionStore);
  setConfig(ConfigKey.Popup, config.popup);
  setConfig(ConfigKey.StorageAdapter, config.storageAdapter);
  setConfig(ConfigKey.PubNub, config.pubnub);

  return {
    apiHost: getBaasHost(),
    apiHostname: format({ protocol: getBaasProtocol(), host: getBaasHost() }),
    apiProtocol: getBaasProtocol(),

    appKey: getAppKey(),
    appSecret: getAppSecret(),
    masterSecret: getMasterSecret(),

    authHost: getAuthHost(),
    authHostname: format({ protocol: getAuthProtocol(), host: getAuthHost() }),
    authProtocol: getAuthProtocol(),
    micHost: getAuthHost(),
    micHostname: format({ protocol: getAuthProtocol(), host: getAuthHost() }),
    micProtocol: getAuthProtocol(),

    _defaultTimeout: getDefaultTimeout(),
    defaultTimeout: getDefaultTimeout(),
    encryptionKey: getEncryptionKey(),
    _appVersion: getAppVersion(),
    appVersion: getAppVersion()
  };
}

export function initialize(config: Config) {
  return init(config);
}

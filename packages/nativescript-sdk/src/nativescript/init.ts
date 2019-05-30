import { init as coreInit } from 'kinvey-js-sdk';
import PubNub from 'pubnub/lib/nativescript';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';
import { getDataFromPackageJson } from './utils';

export interface KinveyConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  storage?: StorageProvider;
}

export function init(config?: KinveyConfig) {
  const configFromPackageJson = getDataFromPackageJson();
  const mergedConfig = Object.assign({}, configFromPackageJson, config);
  const kinveyConfig = coreInit({
    kinveyConfig: mergedConfig,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup,
    storageAdapter: getStorageAdapter(mergedConfig.storage),
    pubnub: PubNub
  })
  return Object.assign({}, kinveyConfig, { storage: mergedConfig.storage, _storage: mergedConfig.storage });
}

export function initialize(config?: KinveyConfig) {
  return init(config);
}

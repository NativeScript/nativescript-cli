import { init as coreInit, KinveyConfig } from 'kinvey-js-sdk';
import PubNub from 'pubnub/lib/nativescript';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';
import { getDataFromPackageJson } from './utils';

export interface NativeScriptKinveyConfig extends KinveyConfig {
  storage?: StorageProvider;
}

export function init(config?: NativeScriptKinveyConfig) {
  const configFromPackageJson = getDataFromPackageJson();
  const mergedConfig = Object.assign({}, configFromPackageJson, config);
  coreInit({
    kinveyConfig: mergedConfig,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup,
    storageAdapter: getStorageAdapter(mergedConfig.storage),
    pubnub: PubNub
  })
  return config;
}

export function initialize(config?: NativeScriptKinveyConfig) {
  return init(config);
}

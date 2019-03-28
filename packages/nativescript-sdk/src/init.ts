import { init as coreInit, KinveyConfig } from 'kinvey-js-sdk';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';

export interface NativeScriptKinveyConfig extends KinveyConfig {
  storage?: StorageProvider;
}

export function init(config: NativeScriptKinveyConfig) {
  coreInit({
    kinveyConfig: config,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup,
    storageAdapter: getStorageAdapter(config.storage)
  })
  return config;
}

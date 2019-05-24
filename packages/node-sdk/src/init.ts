import { init as coreInit } from 'kinvey-js-sdk';
import PubNub from 'pubnub';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';

export interface KinveyConfig {
  appKey: string;
  appSecret: string;
  masterSecret?: string;
  appVersion?: string;
  instanceId?: string;
  storage?: StorageProvider;
}
export function init(config: KinveyConfig) {
  const kinveyConfig = coreInit({
    kinveyConfig: config,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup,
    storageAdapter: getStorageAdapter(config.storage),
    pubnub: PubNub
  })
  return Object.assign({}, kinveyConfig, { storage: config.storage, _storage: config.storage });
}

export function initialize(config: KinveyConfig) {
  return init(config);
}

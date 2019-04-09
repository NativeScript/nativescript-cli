import { init as coreInit, KinveyConfig } from 'kinvey-js-sdk';
import PubNub from 'pubnub';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';

export interface NodeJSKinveyConfig extends KinveyConfig {
  storage?: StorageProvider;
}

export function init(config: NodeJSKinveyConfig) {
  coreInit({
    kinveyConfig: config,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup,
    storageAdapter: getStorageAdapter(config.storage),
    pubnub: PubNub
  })
  return config;
}

export function initialize(config: NodeJSKinveyConfig) {
  return init(config);
}

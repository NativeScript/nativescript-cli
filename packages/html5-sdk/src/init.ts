import { init as coreInit, KinveyConfig } from 'kinvey-js-sdk';
import PubNub from 'pubnub';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';
import { getStorageAdapter, StorageProvider } from './storage';

export interface HTML5KinveyConfig extends KinveyConfig {
  storage?: StorageProvider;
}

export function init(config: HTML5KinveyConfig) {
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

export function initialize(config: HTML5KinveyConfig) {
  return init(config);
}

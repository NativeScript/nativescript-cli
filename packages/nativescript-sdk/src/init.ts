import { init as coreInit, KinveyConfig } from 'kinvey-js-sdk';
import * as HttpAdapter from './httpAdapter';
import * as SessionStore from './sessionStore';
import * as Popup from './popup';

export function init(config: KinveyConfig) {
  coreInit({
    kinveyConfig: config,
    httpAdapter: HttpAdapter,
    sessionStore: SessionStore,
    popup: Popup
  })
  return config;
}

export { KinveyConfig };

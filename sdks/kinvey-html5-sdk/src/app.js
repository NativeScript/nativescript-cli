import {
  init as _init,
  initialize,
  getAppVersion,
  setAppVersion
} from 'kinvey-app';
import { register as registerHttp } from 'kinvey-http-web';
import { register as registerPopup } from 'kinvey-popup-web';
import { register as registerIndexedDBCache } from 'kinvey-cache-indexeddb';

export const StorageProvider = {
  IndexedDB: 'IndexedDB'
};

function init(config) {
  const { storage = StorageProvider.IndexedDB } = config;

  if (storage === StorageProvider.IndexedDB) {
    registerIndexedDBCache();
  }

  registerHttp();
  registerPopup();

  return _init(config);
}

export {
  init,
  initialize,
  getAppVersion,
  setAppVersion
};

import {
  init as _init,
  initialize,
  getAppVersion,
  setAppVersion
} from 'kinvey-app';
import { register as registerHttp } from 'kinvey-http-web';
import { register as registerPopup } from 'kinvey-popup-web';
import { register as registerIndexedDBCache } from 'kinvey-cache-indexeddb';
import { register as registerMemoryCache } from 'kinvey-cache-memory';
import { register as registerWebSQLCache } from 'kinvey-cache-websql';
import pkg from '../package.json';

export const StorageProvider = {
  IndexedDB: 'IndexedDB',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};

function init(config) {
  const { storage = StorageProvider.IndexedDB } = config;

  // Register storage
  if (storage === StorageProvider.IndexedDB) {
    registerIndexedDBCache();
  } else if (storage === StorageProvider.Memory) {
    registerMemoryCache();
  } else if (storage === StorageProvider.WebSQL) {
    registerWebSQLCache();
  }

  // Register http
  registerHttp({
    name: pkg.name,
    version: pkg.version
  });

  // Register popup
  registerPopup();

  // Init the SDK
  return _init(config);
}

export {
  init,
  initialize,
  getAppVersion,
  setAppVersion
};

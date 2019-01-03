import {
  init as _init,
  initialize,
  getAppVersion,
  setAppVersion
} from 'kinvey-app';
import { register as registerHttp } from 'kinvey-http-nativescript';
import { register as registerPopup } from 'kinvey-popup-nativescript';
import { register as registerMemoryCache } from 'kinvey-cache-memory';
import { register as registerSQLiteCache } from 'kinvey-cache-sqlite-nativescript';
import pkg from '../package.json';

export const StorageProvider = {
  Memory: 'Memory',
  SQLite: 'SQLite'
};

function init(config) {
  const { storage = StorageProvider.SQLite } = config;

  // Register storage
  if (storage === StorageProvider.Memory) {
    registerMemoryCache();
  } else if (storage === StorageProvider.SQLite) {
    registerSQLiteCache();
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

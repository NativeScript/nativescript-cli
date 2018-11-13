import {
  init as _init,
  initialize,
  getAppVersion,
  setAppVersion
} from 'kinvey-app';
import { register as registerHttp } from 'kinvey-http-node';
import { register as registerMemoryCache } from 'kinvey-cache-memory';

export const StorageProvider = {
  Memory: 'Memory'
};

function init(config) {
  const { storage = StorageProvider.Memory } = config;

  if (storage === StorageProvider.Memory) {
    registerMemoryCache();
  }

  registerHttp();

  return _init(config);
}

export {
  init,
  initialize,
  getAppVersion,
  setAppVersion
};

import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import * as indexedDB from './indexeddb';
import * as localStorage from './localstorage';
import * as memory from './memory';
import * as sessionStorage from './sessionstorage';
import * as webSQL from './websql';

export const StorageProvider = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  SessionStorage: 'SessionStorage',
  WebSQL: 'WebSQL'
};

export function get() {
  const { storage = StorageProvider.WebSQL } = getConfig();

  if (storage === StorageProvider.IndexedDB) {
    return indexedDB;
  } else if (storage === StorageProvider.LocalStorage) {
    return localStorage;
  } else if (storage === StorageProvider.Memory) {
    return memory;
  } else if (storage === StorageProvider.SessionStorage) {
    return sessionStorage;
  } else if (storage === StorageProvider.WebSQL) {
    return webSQL;
  }

  throw new KinveyError('You must override the default cache store.');
}

import { Errors } from 'kinvey-js-sdk';
import * as IndexedDB from './indexeddb';
import * as LocalStorage from './localstorage';
import * as Memory from './memory';
import * as SessionStorage from './sessionstorage';
import * as WebSQL from './websql';

export enum StorageProvider {
  IndexedDB = 'IndexedDB',
  LocalStorage = 'LocalStorage',
  Memory = 'Memory',
  SessionStorage = 'SessionStorage',
  WebSQL = 'WebSQL'
};

export function getStorageAdapter(storageProvider = StorageProvider.WebSQL) {
  if (storageProvider === StorageProvider.IndexedDB) {
    return IndexedDB;
  } else if (storageProvider === StorageProvider.LocalStorage) {
    return LocalStorage;
  } else if (storageProvider === StorageProvider.Memory) {
    return Memory;
  } else if (storageProvider === StorageProvider.SessionStorage) {
    return SessionStorage;
  } else if (storageProvider === StorageProvider.WebSQL) {
    return WebSQL;
  }

  throw new Errors.KinveyError('You must override the default cache store.');
}

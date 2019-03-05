import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import IndexedDB from './indexeddb';
import LocalStorage from './localstorage';
import Memory from './memory';
import SessionStorage from './sessionstorage';
import WebSQL from './websql';

export const StorageProvider = {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  Memory: 'Memory',
  SessionStorage: 'SessionStorage',
  WebSQL: 'WebSQL'
};

export function get(dbName, collectionName) {
  const { storage = StorageProvider.WebSQL } = getConfig();

  if (storage === StorageProvider.IndexedDB) {
    return new IndexedDB(dbName, collectionName);
  } else if (storage === StorageProvider.LocalStorage) {
    return new LocalStorage(dbName, collectionName);
  } else if (storage === StorageProvider.Memory) {
    return new Memory(dbName, collectionName);
  } else if (storage === StorageProvider.SessionStorage) {
    return new SessionStorage(dbName, collectionName);
  } else if (storage === StorageProvider.WebSQL) {
    return new WebSQL(dbName, collectionName);
  }

  throw new KinveyError('You must override the default cache store.');
}

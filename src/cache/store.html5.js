import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import * as indexedDB from './indexeddb';
import * as memory from './memory';
import * as webSQL from './websql';

export const StorageProvider = {
  IndexedDB: 'IndexedDB',
  Memory: 'Memory',
  WebSQL: 'WebSQL'
};

// eslint-disable-next-line import/prefer-default-export
export function get() {
  const { storage = StorageProvider.WebSQL } = getConfig();

  if (storage === StorageProvider.IndexedDB) {
    return indexedDB;
  } else if (storage === StorageProvider.Memory) {
    return memory;
  } else if (storage === StorageProvider.WebSQL) {
    return webSQL;
  }

  throw new KinveyError('You must override the default cache store.');
}

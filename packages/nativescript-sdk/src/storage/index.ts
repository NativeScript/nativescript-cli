import { KinveyError } from 'kinvey-js-sdk/lib/src/errors/kinvey';
import * as SQLite from './sqlite';

export enum StorageProvider {
  SQLite = 'SQLite'
};

export function getStorageAdapter(storageProvider = StorageProvider.SQLite) {
  if (storageProvider === StorageProvider.SQLite) {
    return SQLite;
  }

  throw new KinveyError('You must override the default cache store.');
}

import { Errors } from 'kinvey-js-sdk';
import * as SQLite from './sqlite';

export enum StorageProvider {
  SQLite = 'SQLite'
};

export function getStorageAdapter(storageProvider = StorageProvider.SQLite) {
  if (storageProvider === StorageProvider.SQLite) {
    return SQLite;
  }

  throw new Errors.KinveyError('You must override the default cache store.');
}

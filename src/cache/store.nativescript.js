import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import * as memory from './memory';
import * as sqlite from './sqlite';

export const StorageProvider = {
  Memory: 'Memory',
  SQLite: 'SQLite'
};

export function get() {
  const { storage = StorageProvider.SQLite } = getConfig();

  if (storage === StorageProvider.Memory) {
    return memory;
  } else if (storage === StorageProvider.SQLite) {
    return sqlite;
  }

  throw new KinveyError('You must override the default cache store.');
}

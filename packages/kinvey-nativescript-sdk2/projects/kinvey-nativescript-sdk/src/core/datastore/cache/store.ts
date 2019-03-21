import { get as getConfig } from '../../kinvey/config';
import KinveyError from '../../errors/kinvey';
import Memory from './memory';
import Sqlite from './sqlite';

export const StorageProvider = {
  Memory: 'Memory',
  SQLite: 'SQLite'
};

export function get(dbName, collectionName) {
  const { storage = StorageProvider.SQLite } = getConfig();

  if (storage === StorageProvider.Memory) {
    return new Memory(dbName, collectionName);
  } else if (storage === StorageProvider.SQLite) {
    return new Sqlite(dbName, collectionName);
  }

  throw new KinveyError('You must override the default cache store.');
}

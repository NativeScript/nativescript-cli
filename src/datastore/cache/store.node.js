import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import Memory from './memory';

export const StorageProvider = {
  Memory: 'Memory'
};

export function get(dbName, collectionName) {
  const { storage = StorageProvider.Memory } = getConfig();

  if (storage === StorageProvider.Memory) {
    return new Memory(dbName, collectionName);
  }

  throw new KinveyError('You must override the default cache store.');
}

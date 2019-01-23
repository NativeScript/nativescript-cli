import { get as getConfig } from '../kinvey/config';
import KinveyError from '../errors/kinvey';
import * as memory from './memory';

export const StorageProvider = {
  Memory: 'Memory'
};

export function get() {
  const { storage = StorageProvider.Memory } = getConfig();

  if (storage === StorageProvider.Memory) {
    return memory;
  }

  throw new KinveyError('You must override the default cache store.');
}

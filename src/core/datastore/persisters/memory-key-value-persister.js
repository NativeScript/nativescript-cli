import { KeyValuePersister } from './key-value-persister';

const _storage = {};

export class MemoryKeyValuePersister extends KeyValuePersister {
  _readFromPersistance(key) {
    return Promise.resolve(_storage[key]);
  }

  _writeToPersistance(key, array) {
    _storage[key] = array;
    return Promise.resolve();
  }

  _deletePersistance(key) {
    delete _storage[key];
    return Promise.resolve();
  }
}

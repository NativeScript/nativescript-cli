import { KeyValuePersister } from './key-value-persister';

const _storage = {};

export class MemoryKeyValuePersister extends KeyValuePersister {
  getKeys() {
    return Promise.resolve(Object.keys(_storage));
  }

  _readFromPersistance(key) {
    return Promise.resolve(_storage[key]);
  }

  _writeToPersistance(key, array) {
    _storage[key] = array;
    return Promise.resolve(true);
  }

  _deleteFromPersistance(key) {
    delete _storage[key];
    return Promise.resolve(true);
  }
}

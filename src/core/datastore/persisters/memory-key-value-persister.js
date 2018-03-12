import { Promise } from 'es6-promise';

import { KeyValuePersister } from './key-value-persister';

const _storage = {};

export class MemoryKeyValuePersister extends KeyValuePersister {
  getKeys() {
    return Promise.resolve(Object.keys(_storage));
  }

  _readFromPersistance(key) {
    const result = _storage[key] || [];
    return Promise.resolve(result.slice(0));
  }

  _writeToPersistance(key, array) {
    _storage[key] = array.slice(0);
    return Promise.resolve(true);
  }

  _deleteFromPersistance(key) {
    delete _storage[key];
    return Promise.resolve(true);
  }
}

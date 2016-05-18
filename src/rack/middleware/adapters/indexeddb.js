import { KinveyError } from '../../../errors';
import { open } from 'idb-factory';
import { request, requestTransaction, requestCursor } from 'idb-request';
import map from 'lodash/map';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';

if (typeof window !== 'undefined') {
  require('indexeddbshim'); // eslint-disable-line global-require
  global.forceIndexedDB = global.shimIndexedDB;
}

const TransactionMode = {
  ReadWrite: 'readwrite',
  ReadOnly: 'readonly',
};
Object.freeze(TransactionMode);

/**
 * @private
 */
export default class IndexedDB {
  constructor(name) {
    if (!name) {
      throw new KinveyError('A name for the collection is required to use the indexeddb persistence adapter.', name);
    }

    if (!isString(name)) {
      throw new KinveyError(
        'The name of the collection must be a string to use the indexeddb persistence adapter', name);
    }

    this.name = name;
  }

  async createTransaction(collection, write = false) {
    const db = await open(this.name, 1, e => {
      if (e.oldVersion < 1) {
        e.target.result.createObjectStore(collection, { keyPath: '_id' });
      }
    });

    const mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
    const txn = db.transaction([collection], mode);
    return txn;
  }

  async find(collection) {
    const txn = await this.createTransaction(collection);
    const store = txn.objectStore(collection);
    const request = store.openCursor();
    const response = [];

    await requestCursor(request, cursor => {
      response.push(cursor.value);
      cursor.continue();
    });

    return response;
  }

  async findById(collection, id) {
    const txn = await this.createTransaction(collection);
    const store = txn.objectStore(collection);
    const request = store.get(id);
    let entity = undefined;

    await requestCursor(request, (item, stop) => {
      entity = item;
      stop();
    });

    await requestTransaction(txn);
    return entity;
  }

  async save(collection, entities) {
    const txn = await this.createTransaction(collection, true);
    const store = txn.objectStore(collection);
    let singular = false;

    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    const promises = map(entities, entity => request(store.put(entity)));
    promises.push(requestTransaction(txn));
    await Promise.all(promises);
    return singular ? entities[0] : entities;
  }

  async removeById(collection, id) {
    const txn = await this.createTransaction(collection, true);
    const store = txn.objectStore(collection);
    const request = store.get(id);
    let entity = undefined;

    await requestCursor(request, (item, stop) => {
      entity = item;
      stop();
    });

    if (entity) {
      store.delete(id);
      await requestTransaction(txn);
    }

    return entity;
  }

  static isSupported() {
    const indexedDB = global.focedIndexedDB
                    || global.indexedDB
                    || global.webkitIndexedDB
                    || global.mozIndexedDB
                    || global.msIndexedDB
                    || global.shimIndexedDB;
    return !!indexedDB;
  }
}

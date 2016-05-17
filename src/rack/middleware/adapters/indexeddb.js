import { KinveyError, NotFoundError } from '../../../errors';
import { open } from 'idb-factory';
import { request, requestTransaction } from 'idb-request';
import map from 'lodash/map';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
const indexedDB = global.indexedDB ||
                  global.mozIndexedDB ||
                  global.webkitIndexedDB ||
                  global.msIndexedDB;


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
    const db = await open(name, 1, e => {
      if (e.oldVersion < 1) {
        e.target.result.createObjectStore(collection, { keyPath: '_id' });
      }
    });

    const mode = write ? TransactionMode.ReadWrite : TransactionMode.ReadOnly;
    const txn = db.transaction([collection], mode);
    return txn;
  }

  find(collection) {
    const promise = new Promise((resolve, reject) => {
      if (!collection) {
        return reject(new KinveyError('A collection was not provided.'));
      }

      return this.openTransaction(collection, false, store => {
        const request = store.openCursor();
        const response = [];

        request.onsuccess = e => {
          const cursor = e.target.result;

          if (cursor) {
            response.push(cursor.value);
            return cursor.continue();
          }

          return resolve(response);
        };

        request.onerror = e => {
          reject(new KinveyError(`An error occurred while fetching data from the ${collection} ` +
            `collection on the ${this.name} indexedDB database. Received the error code ${e.target.errorCode}.`));
        };
      }, error => {
        if (error instanceof NotFoundError) {
          return resolve([]);
        }

        return reject(error);
      });
    });

    return promise;
  }

  findById(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, false, store => {
        const request = store.get(id);

        request.onsuccess = e => {
          const entity = e.target.result;

          if (entity) {
            return resolve(entity);
          }

          return reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} indexedDB database.`));
        };

        request.onerror = (e) => {
          reject(new KinveyError(`An error occurred while retrieving an entity with _id = ${id} ` +
            `from the ${collection} collection on the ${this.name} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, error => {
        if (error instanceof NotFoundError) {
          return reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
            `collection on the ${this.name} indexedDB database.`));
        }

        return reject(error);
      });
    });

    return promise;
  }

  save(collection, entities) {
    const promise = this.createTransaction(collection, true).then(txn => {
      const store = txn.objectStore(collection);
      let singular = false;

      if (!isArray(entities)) {
        singular = true;
        entities = [entities];
      }

      const promises = map(entities, entity => request(store.put(entity)));
      promises.push(requestTransaction(txn));

      return Promise.all(promises).then(results => singular ? results[0] : results);
    });

    return promise;
  }

  removeById(collection, id) {
    const promise = new Promise((resolve, reject) => {
      this.openTransaction(collection, true, store => {
        const request = store.transaction;
        const doc = store.get(id);
        store.delete(id);

        request.oncomplete = () => {
          if (!doc.result) {
            return reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection} `
              + `collection on the ${this.name} indexedDB database.`));
          }

          return resolve(doc.result);
        };

        request.onerror = e => {
          reject(new KinveyError(`An error occurred while deleting an entity with id = ${id} ` +
            `in the ${collection} collection on the ${this.name} indexedDB database. ` +
            `Received the error code ${e.target.errorCode}.`));
        };
      }, reject);
    });

    return promise;
  }

  static isSupported() {
    return !!indexedDB;
  }
}

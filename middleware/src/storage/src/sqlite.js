import Promise from 'es6-promise';
import { NotFoundError, isDefined } from 'kinvey-js-sdk/dist/export';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';

// let dbCache = {};
// let isSupported;

// const TransactionMode = {
//   ReadWrite: 'readwrite',
//   ReadOnly: 'readonly',
// };
// Object.freeze(TransactionMode);

class SQLite {
  constructor(name) {
    // if (isDefined(name) === false) {
    //   throw new Error('A name is required to use the IndexedDB adapter.', name);
    // }

    // if (isString(name) === false) {
    //   throw new Error('The name must be a string to use the IndexedDB adapter', name);
    // }

    // this.name = name;
    // this.inTransaction = false;
    // this.queue = [];
  }

  openTransaction(collection, write = false, success, error, force = false) {

  }

  close() {
  }

  find(collection) {
    // return new Promise((resolve, reject) => {
    //   this.openTransaction(collection, false, (txn) => {
    //     const store = txn.objectStore(collection);
    //     const request = store.openCursor();
    //     const entities = [];

    //     request.onsuccess = (e) => {
    //       const cursor = e.target.result;

    //       if (cursor) {
    //         entities.push(cursor.value);
    //         return cursor.continue();
    //       }

    //       return resolve(entities);
    //     };

    //     request.onerror = (e) => {
    //       reject(e);
    //     };
    //   }, reject);
    // });
  }

  findById(collection, id) {
    // return new Promise((resolve, reject) => {
    //   this.openTransaction(collection, false, (txn) => {
    //     const store = txn.objectStore(collection);
    //     const request = store.get(id);

    //     request.onsuccess = (e) => {
    //       const entity = e.target.result;

    //       if (entity) {
    //         resolve(entity);
    //       } else {
    //         reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
    //          + ` collection on the ${this.name} IndexedDB database.`));
    //       }
    //     };

    //     request.onerror = () => {
    //       reject(new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
    //          + ` collection on the ${this.name} IndexedDB database.`));
    //     };
    //   }, reject);
    // });
  }

  save(collection, entities) {
    // let singular = false;

    // if (!isArray(entities)) {
    //   singular = true;
    //   entities = [entities];
    // }

    // if (entities.length === 0) {
    //   return Promise.resolve(null);
    // }

    // return new Promise((resolve, reject) => {
    //   this.openTransaction(collection, true, (txn) => {
    //     const store = txn.objectStore(collection);

    //     forEach(entities, (entity) => {
    //       store.put(entity);
    //     });

    //     txn.oncomplete = () => {
    //       resolve(singular ? entities[0] : entities);
    //     };

    //     txn.onerror = (e) => {
    //       reject(new Error(`An error occurred while saving the entities to the ${collection}`
    //         + ` collection on the ${this.name} IndexedDB database. ${e.target.error.message}.`));
    //     };
    //   }, reject);
    // });
  }

  removeById(collection, id) {
    // return new Promise((resolve, reject) => {
    //   this.openTransaction(collection, true, (txn) => {
    //     const store = txn.objectStore(collection);
    //     const request = store.get(id);
    //     store.delete(id);

    //     txn.oncomplete = () => {
    //       const entity = request.result;

    //       if (entity) {
    //         resolve(entity);
    //       } else {
    //         reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection}`
    //           + ` collection on the ${this.name} IndexedDB database.`));
    //       }
    //     };

    //     txn.onerror = () => {
    //       reject(new NotFoundError(`An entity with id = ${id} was not found in the ${collection}`
    //           + ` collection on the ${this.name} IndexedDB database.`));
    //     };
    //   }, reject);
    // });
  }

  clear() {
    // Close the open DB to prevent from blocking the deleteDatabase operation
    // this.close();

    // // Delete the database
    // return new Promise((resolve, reject) => {
    //   const indexedDB = global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB;
    //   const request = indexedDB.deleteDatabase(this.name);

    //   request.onsuccess = () => {
    //     dbCache = {};
    //     resolve();
    //   };

    //   request.onerror = (e) => {
    //     reject(new Error(`An error occurred while clearing the ${this.name} IndexedDB database.`
    //         + ` ${e.target.error.message}.`));
    //   };

    //   request.onblocked = () => {
    //     reject(new Error(`The ${this.name} IndexedDB database could not be cleared`
    //       + ' due to the operation being blocked.'));
    //   };
    // });
  }
}

export default {
  load(name) {
//    const indexedDB = global.indexedDB || global.webkitIndexedDB || global.mozIndexedDB || global.msIndexedDB;
    const db = new SQLite(name);

    return db;

    // if (isDefined(indexedDB) === false) {
    //   return Promise.resolve(undefined);
    // }

    // if (isDefined(isSupported)) {
    //   if (isSupported) {
    //     return Promise.resolve(db);
    //   }

    //   return Promise.resolve(undefined);
    // }

    // return db.save('__testSupport', { _id: '1' })
    //   .then(() => {
    //     isSupported = true;
    //     return db;
    //   })
    //   .catch(() => {
    //     isSupported = false;
    //     return undefined;
    //   });
  }
};

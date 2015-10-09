import KinveyError from '../../errors/error';
import Query from '../../query';
import when from 'when';
let inTransaction = false;
let indexedDB = require(process.env.KINVEY_INDEXEDDB_LIB);

if (process.env.KINVEY_PLATFORM_ENV !== 'node') {
  global.shimIndexedDB.__useShim();
  indexedDB = global.shimIndexedDB || global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.OIndexedDB || global.msIndexedDB;
}

export default class IndexedDBAdapter {
  constructor(dbInfo) {
    this.dbInfo = dbInfo;
    this.queue = [];
  }

  transaction(write = false, success, error, force = false) {
    const name = this.dbInfo.name;
    const collection = this.dbInfo.collection;

    if (this.db && (force || !inTransaction)) {
      if (this.db.objectStoreNames.indexOf(collection) !== -1) {
        const mode = write ? 'readwrite' : 'readonly';

        try {
          const txn = this.db.transaction([collection], mode);

          if (txn) {
            const store = txn.objectStore(collection);
            return success(store);
          }

          return error(new KinveyError('Unable to open a transaction for the database. Please try this database transaction again.'));
        } catch (err) {
          return error(err);
        }
      } else if (!write) {
        return error(new KinveyError(`The collection ${collection} was not found in the database.`));
      }
    }

    if (force !== true && inTransaction) {
      return this.queue.push(() => {
        return this.transaction(write, success, error);
      });
    }

    inTransaction = true;
    let request;

    if (this.db) {
      const version = this.db.version + 1;
      this.db.close();
      request = indexedDB.open(name, version);
    } else {
      request = indexedDB.open(name);
    }

    request.onupgradeneeded = () => {
      if (write) {
        request.result.createObjectStore(collection, { keyPath: '_id' });
      }
    };

    request.onsuccess = () => {
      this.db = request.result;

      this.db.onversionchange = () => {
        if (this.db) {
          this.db.close();
          this.db = null;
        }
      };

      const wrap = (cb) => {
        return (arg) => {
          cb(arg);
          inTransaction = false;

          if (this.queue.length > 0) {
            const queue = this.queue;
            this.queue = [];
            queue.forEach(fn => fn());
          }
        };
      };

      this.transaction(write, wrap(success), wrap(error), true);
    };

    request.onerror = function(e) {
      error(e);
    };
  }

  find(query) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(false, (store) => {
        const request = store.openCursor();
        const response = [];

        request.onsuccess = function() {
          const cursor = request.result;

          if (cursor) {
            response.push(cursor.value);
            cursor.continue();
          } else {
            resolve(response);
          }
        };

        request.onerror = function(e) {
          reject(e);
        };
      }, reject);
    }).then(docs => {
      if (query) {
        return query.process(docs);
      }

      return docs;
    }).catch(() => {
      // TODO: check if collection not found error
      return [];
    });

    return promise;
  }

  count(query) {
    const promise = this.find(query).then(docs => {
      return docs.length;
    });

    return promise;
  }

  findAndModify(id, fn) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(true, (store) => {
        const txn = store.transaction;
        const request = store.get(id);
        let doc;

        request.onsuccess = function() {
          doc = fn(request.result || null);
          store.put(doc);
        };

        txn.oncomplete = function() {
          resolve(doc);
        };

        txn.onerror = function(e) {
          reject(e);
        };
      }, reject);
    });

    return promise;
  }

  group(aggregation) {
    const query = new Query({ filter: aggregation.condition });

    // const reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    // aggregation.reduce = new Function(['doc', 'out'], reduce);

    const promise = this.find(query).then(docs => {
      const groups = {};

      docs.forEach((doc) => {
        const group = {};

        for (const name in aggregation.key) {
          if (aggregation.key.hasOwnProperty(name)) {
            group[name] = doc[name];
          }
        }

        const key = JSON.stringify(group);
        if (!groups[key]) {
          groups[key] = group;

          for (const attr in aggregation.initial) {
            if (aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        aggregation.reduce(doc, groups[key]);
      });

      const response = [];
      for (const segment in groups) {
        if (groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }

      return response;
    });

    return promise;
  }

  get(id) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(false, (store) => {
        const request = store.get(id);

        request.onsuccess = function() {
          if (request.result) {
            return resolve(request.result);
          }

          reject(new KinveyError('Entity not found in the collection.'));
        };

        request.onerror = function(e) {
          reject(e);
        };
      }, reject);
    });

    return promise;
  }

  save(doc) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(true, (store) => {
        const request = store.put(doc);

        request.onsuccess = function() {
          resolve(doc);
        };

        request.onerror = function(e) {
          reject(e);
        };
      }, reject);
    });

    return promise;
  }

  batch(docs) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(true, (store) => {
        const txn = store.transaction;

        docs.forEach((doc) => {
          store.put(doc);
        });

        txn.oncomplete = function() {
          resolve(docs);
        };

        txn.onerror = function(e) {
          reject(e);
        };
      }, reject);
    });

    return promise;
  }

  delete(id) {
    const promise = when.promise((resolve, reject) => {
      this.transaction(true, (store) => {
        const txn = store.transaction;
        const request = store.get(id);
        store.delete(id);

        txn.oncomplete = function() {
          if (!request.result) {
            return reject(new KinveyError('This entity was not found in the collection.'));
          }

          resolve({
            count: 1,
            documents: [request.result]
          });
        };

        txn.onerror = function(e) {
          reject(e);
        };
      }, reject);
    });

    return promise;
  }

  clean(query) {
    const promise = this.find(query).then(docs => {
      if (docs.length === 0) {
        return { count: 0, documents: []};
      }

      return when.promise((resolve, reject) => {
        this.transaction(true, (store) => {
          const txn = store.transaction;

          docs.forEach((doc) => {
            store.delete(doc._id);
          });

          txn.oncomplete = function() {
            resolve({
              count: docs.length,
              documents: docs
            });
          };

          txn.onerror = function(e) {
            reject(e);
          };
        }, reject);
      });
    });

    return promise;
  }

  clear() {
    const promise = when.promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const request = indexedDB.deleteDatabase(this.dbInfo.name);

      request.onsuccess = function() {
        resolve(null);
      };

      request.onerror = function(e) {
        reject(e);
      };
    });

    return promise;
  }

  static isSupported() {
    return indexedDB ? true : false;
  }
}

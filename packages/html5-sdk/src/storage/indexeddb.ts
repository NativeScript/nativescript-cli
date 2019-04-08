const DB_CACHE: any = {};

const IndexedDBTransactionMode = {
  readWrite: 'readwrite',
  readOnly: 'readonly',
};

class IndexedDB {
  public dbName: string;
  public _db: any;
  public inTransaction: boolean;
  public queue: any;

  constructor(dbName: string) {
    this.dbName = dbName;
    this.db = DB_CACHE[this.dbName];
    this.inTransaction = false;
    this.queue = [];
  }

  get db() {
    return this._db;
  }

  set db(db) {
    if (db) {
      this._db = db;
      DB_CACHE[this.dbName] = db;
    } else {
      this._db = null;
      delete DB_CACHE[this.dbName];
    }
  }

  hasObjectStore(objectStoreName: string) {
    if (this.db && this.db.objectStoreName) {
      return typeof this.db.objectStoreNames.contains === 'function'
        ? this.db.objectStoreNames.contains(objectStoreName)
        : this.db.objectStoreNames.indexOf(objectStoreName) !== -1;
    }

    return false;
  }

  openTransaction(objectStoreName: string, mode = IndexedDBTransactionMode.readOnly) {
    const txn = this.db.transaction(objectStoreName, mode);

    if (!txn) {
      throw new Error(`Unable to open a transaction for ${objectStoreName} collection on the ${this.dbName} IndexedDB database.`);
    }

    return txn;
  }

  openDB() {
    const indexedDB = window.indexedDB || (window as any).webkitIndexedDB || (window as any).mozIndexedDB || (window as any).msIndexedDB;

    if (this.db) {
      const version = this.db.version + 1;
      this.close();
      return indexedDB.open(this.dbName, version);
    }

    return indexedDB.open(this.dbName);
  }

  open(objectStoreName: string, write = false, success: any, error: any, force = false) {
    try {
      if (this.db) {
        if (this.db.objectStoreNames.contains(objectStoreName)) {
          const mode = write ? IndexedDBTransactionMode.readWrite : IndexedDBTransactionMode.readOnly;
          return success(this.openTransaction(objectStoreName, mode));
        } else if (!write) {
          throw new Error(`The ${objectStoreName} collection was not found on the ${this.dbName} IndexedDB database.`);
        }
      }

      if (!force && this.inTransaction) {
        return this.queue.push(() => this.open(objectStoreName, write, success, error));
      }

      this.inTransaction = true;
      const request = this.openDB();

      // If the database is opened with an higher version than its current, the
      // `upgradeneeded` event is fired. Save the handle to the database, and
      // create the collection.
      request.onupgradeneeded = (e: any) => {
        this.db = e.target.result;

        if (write && !this.db.objectStoreNames.contains(objectStoreName)) {
          this.db.createObjectStore(objectStoreName, { keyPath: '_id' });
        }
      };

      // The `success` event is fired after `upgradeneeded` terminates.
      // Save the handle to the database.
      request.onsuccess = (e: any) => {
        this.db = e.target.result;

        // If a second instance of the same IndexedDB database performs an
        // upgrade operation, the `versionchange` event is fired. Then, close the
        // database to allow the external upgrade to proceed.
        this.db.onversionchange = () => this.close();

        // Try to obtain the collection handle by recursing. Append the handlers
        // to empty the queue upon success and failure. Set the `force` flag so
        // all but the current transaction remain queued.
        const wrap = (done: any) => {
          const callbackFn = (arg: any) => {
            done(arg);

            // Switch flag
            this.inTransaction = false;

            // The database handle has been established, we can now safely empty
            // the queue. The queue must be emptied before invoking the concurrent
            // operations to avoid infinite recursion.
            if (this.queue.length > 0) {
              const pending = this.queue;
              this.queue = [];
              pending.forEach((fn: any) => {
                fn.call(this);
              });
            }
          };
          return callbackFn;
        };

        return this.open(objectStoreName, write, wrap(success), wrap(error), true);
      };

      // The `blocked` event is not handled. In case such an event occurs, it
      // will resolve itself since the `versionchange` event handler will close
      // the conflicting database and enable the `blocked` event to continue.
      request.onblocked = () => { };

      // Handle errors
      request.onerror = (e: any) => {
        error(new Error(`Unable to open the ${this.dbName} IndexedDB database. ${e.target.error.message}.`));
      };
    } catch (e) {
      error(e);
    }

    return null;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export function find(dbName: string, objectStoreName: string) {
  const db = new IndexedDB(dbName);
  return new Promise<any[]>((resolve, reject) => {
    db.open(objectStoreName, false, (txn: any) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.openCursor();
      const docs: any = [];

      request.onsuccess = (e: any) => {
        const cursor = e.target.result;

        if (cursor) {
          docs.push(cursor.value);
          return cursor.continue();
        }

        return resolve(docs);
      };

      request.onerror = (e: any) => {
        reject(e.target.error);
      };
    }, (error: any) => {
      if (error.message.indexOf('not found') !== -1) {
        resolve([]);
      } else {
        reject(error);
      }
    });
  });
}

export function count(dbName: string, objectStoreName: string) {
  const db = new IndexedDB(dbName);
  return new Promise<number>((resolve, reject) => {
    db.open(objectStoreName, false, (txn: any) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e: any) => reject(e.target.error);
    }, (error: any) => {
      if (error.message.indexOf('not found') !== -1) {
        resolve(0);
      } else {
        reject(error);
      }
    });
  });
}

export function findById(dbName: string, objectStoreName: string, id: string) {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.open(objectStoreName, false, (txn: any) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.get(id);

      request.onsuccess = (e: any) => {
        resolve(e.target.result);
      };

      request.onerror = (e: any) => {
        reject(e.target.error);
      };
    }, reject);
  });
}

export function save(dbName: string, objectStoreName: string, docs: any = []) {
  const db = new IndexedDB(dbName);
  return new Promise<any[]>((resolve, reject) => {
    db.open(objectStoreName, true, (txn: any) => {
      const store = txn.objectStore(objectStoreName);
      let docsToSave = docs;

      if (!Array.isArray(docs)) {
        docsToSave = [docs];
      }

      docsToSave.forEach((doc: any) => {
        store.put(doc);
      });

      txn.oncomplete = () => {
        resolve(docs);
      };

      txn.onerror = (e: any) => {
        reject(new Error(`An error occurred while saving the entities to the ${objectStoreName} collection on the ${dbName} IndexedDB database. ${e.target.error.message}.`));
      };
    }, reject);
  });
}

export function removeById(dbName: string, objectStoreName: string, id: string) {
  const db = new IndexedDB(dbName);
  return new Promise<number>((resolve, reject) => {
    db.open(objectStoreName, true, (txn: any) => {
      const store = txn.objectStore(objectStoreName);
      const request = store.get(id);
      store.delete(id);

      txn.oncomplete = () => {
        const doc = request.result;

        if (doc) {
          resolve(1);
        } else {
          reject(new Error(`An entity with _id = ${id} was not found in the ${objectStoreName} collection on the ${dbName} database.`));
        }
      };

      txn.onerror = () => {
        reject(new Error(`An entity with _id = ${id} was not found in the ${objectStoreName} collection on the ${dbName} database.`));
      };
    }, reject);
  });
}

export function clear(dbName: string, objectStoreName: string): Promise<any> {
  const db = new IndexedDB(dbName);
  return new Promise((resolve, reject) => {
    db.open(objectStoreName, true, (txn: any) => {
      const objectStore = txn.objectStore(objectStoreName);
      objectStore.clear();
      txn.oncomplete = () => resolve(true);
      txn.onerror = (err: any) => reject(err);
    }, reject);
  });
}

export function clearDatabase(dbName: string) {
  return new Promise((resolve, reject) => {
    const indexedDB = window.indexedDB || (window as any).webkitIndexedDB || (window as any).mozIndexedDB || (window as any).msIndexedDB;
    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => {
      delete DB_CACHE[dbName];
      resolve(true);
    };

    request.onerror = (e: any) => {
      reject(new Error(`An error occurred while clearing the ${dbName} IndexedDB database. ${e.target.error.message}.`));
    };

    request.onblocked = () => {
      reject(new Error(`The ${dbName} IndexedDB database could not be cleared due to the operation being blocked.`));
    };
  });
}

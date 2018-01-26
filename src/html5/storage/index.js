import { Storage, StorageProvider as CoreStorageProvider } from '../../core/request';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter, SessionStorageAdapter } from './webstorage';

export const StorageProvider = Object.assign({}, CoreStorageProvider, {
  IndexedDB: 'IndexedDB',
  LocalStorage: 'LocalStorage',
  SessionStorage: 'SessionStorage',
  WebSQL: 'WebSQL'
});
Object.freeze(StorageProvider);

export class Html5Storage extends Storage {
  constructor(name, storageProviders = [StorageProvider.WebSQL, StorageProvider.IndexedDB, StorageProvider.LocalStorage, StorageProvider.SessionStorage, StorageProvider.Memory]) {
    super(name, storageProviders);
  }

  loadAdapter() {
    return this.storageProviders.reduce((promise, storageProvider) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageProvider) {
          case StorageProvider.IndexedDB:
            return IndexedDBAdapter.load(this.name);
          case StorageProvider.LocalStorage:
            return LocalStorageAdapter.load(this.name);
          case StorageProvider.SessionStorage:
            return SessionStorageAdapter.load(this.name);
          case StorageProvider.WebSQL:
            return WebSQLAdapter.load(this.name);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}

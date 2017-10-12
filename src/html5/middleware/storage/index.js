import { Storage as CoreStorage } from '../../../core/request/src/middleware/src/storage';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter, SessionStorageAdapter } from './webstorage';

export class Storage extends CoreStorage {
  loadAdapter() {
    return WebSQLAdapter.load(this.name)
      .then((adapter) => {
        if (!adapter) {
          return IndexedDBAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return LocalStorageAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return SessionStorageAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (!adapter) {
          return super.loadAdapter();
        }

        return adapter;
      });
  }
}

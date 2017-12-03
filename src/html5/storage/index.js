import { Storage } from '../../core/request';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter, SessionStorageAdapter } from './webstorage';

export class Html5Storage extends Storage {
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

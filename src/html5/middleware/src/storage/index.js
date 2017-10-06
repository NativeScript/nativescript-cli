import { isDefined } from 'kinvey-js-sdk/dist/export';
import { Storage as CoreStorage } from 'kinvey-js-sdk/dist/request/src/middleware/src/storage';
import { IndexedDBAdapter } from './indexeddb';
import { WebSQLAdapter } from './websql';
import { LocalStorageAdapter } from './webstorage';

export default class Storage extends CoreStorage {
  loadAdapter() {
    return WebSQLAdapter.load(this.name)
      .then((adapter) => {
        if (isDefined(adapter) === false) {
          return IndexedDBAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (isDefined(adapter) === false) {
          return LocalStorageAdapter.load(this.name);
        }

        return adapter;
      })
      .then((adapter) => {
        if (isDefined(adapter) === false) {
          return super.loadAdapter();
        }

        return adapter;
      });
  }
}

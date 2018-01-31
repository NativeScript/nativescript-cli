import { isDefined, isEmpty } from '../../core/utils';
import { CacheMiddleware as CoreCacheMiddleware, Storage as CoreStorage, StorageProvider as CoreStorageProvider } from '../../core/request';
import { sqLite } from './sqlite';

export const StorageProvider = Object.assign({}, CoreStorageProvider, {
  SQLite: 'SQLite'
});
Object.freeze(StorageProvider);

class Storage extends CoreStorage {
  name: string;
  storageProviders: Array<string>;

  constructor(name, storageProviders = [StorageProvider.SQLite, StorageProvider.Memory]) {
    super(name, storageProviders);
  }

  loadAdapter() {
    return this.storageProviders.reduce((promise, storageProvider) => {
      return promise.then((adapter) => {
        if (adapter) {
          return adapter;
        }

        switch (storageProvider) {
          case StorageProvider.SQLite:
            return sqLite.load(this.name);
          default:
            return super.loadAdapter();
        }
      });
    }, Promise.resolve());
  }
}

export class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name, storageProviders) {
    return new Storage(name, storageProviders);
  }
}


import { isDefined } from 'kinvey-js-sdk/dist/export';
import { CacheMiddleware as CoreCacheMiddleware } from 'kinvey-js-sdk/dist/request';
import { Storage as CoreStorage } from 'kinvey-js-sdk/dist/request/src/middleware/src/storage';
import { SQLite } from './sqlite';

class Storage extends CoreStorage {
  name: string;

  constructor(name: string) {
    super(name);
  }

  loadAdapter() {
    return SQLite.load(this.name)
      .then((adapter) => {
        if (!isDefined(adapter)) {
          return super.loadAdapter();
        }

        return adapter;
      });
  }
}

export class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name): Storage {
    return new Storage(name);
  }
}

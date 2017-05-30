import { CacheMiddleware } from 'kinvey-js-sdk/dist/request';
import KinveyStorage from 'kinvey-js-sdk/dist/request/src/middleware/src/storage';
import { SQLite } from '../../storage';

class Storage extends KinveyStorage {
  name: string;

  constructor(name: string) {
    super(name);
  }

  loadAdapter() {
    return SQLite.load(this.name);
  }
}

export class NativeScriptCacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

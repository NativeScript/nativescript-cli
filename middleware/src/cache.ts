import { CacheMiddleware } from 'kinvey-js-sdk/dist/request';
import { Storage } from './storage';

export class NativeScriptCacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

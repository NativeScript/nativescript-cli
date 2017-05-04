import { CacheMiddleware } from 'kinvey-js-sdk/dist/export';
import Storage from './storage';

export default class NativeScriptCacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

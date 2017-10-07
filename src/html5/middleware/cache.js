import { CacheMiddleware as CoreCacheMiddleware } from '../../core/request';
import { Storage } from './storage';

export class CacheMiddleware extends CoreCacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

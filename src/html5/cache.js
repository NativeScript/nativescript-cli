import { CacheMiddleware } from '../core/request';
import { Html5Storage } from './storage';

export class Html5CacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Html5Storage(name);
  }
}

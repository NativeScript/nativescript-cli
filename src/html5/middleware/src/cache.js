import { CacheMiddleware } from '../../../core/request';
import Storage from './storage';

export default class HTML5CacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

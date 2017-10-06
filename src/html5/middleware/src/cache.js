import { CacheMiddleware } from 'kinvey-js-sdk/dist/export';
import Storage from './storage';

export default class HTML5CacheMiddleware extends CacheMiddleware {
  loadStorage(name) {
    return new Storage(name);
  }
}

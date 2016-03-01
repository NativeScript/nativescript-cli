import { wrapCallbacks } from './utils';
import { Sync as CoreSync } from '../src/sync';

export class Sync {
  static count(collection, options) {
    const promise = CoreSync.count();
    return wrapCallbacks(promise, options);
  }

  static destruct() {
    // TODO
  }

  static execute(options) {
    const promise = CoreSync.push(options);
    return wrapCallbacks(promise, options);
  }

  static init(options) {
    CoreSync.init(options);
  }

  static isEnabled() {
    return CoreSync.isEnabled();
  }

  static isOnline() {
    return CoreSync.isOnline();
  }

  static offline(options) {
    const promise = CoreSync.offline();
    return wrapCallbacks(promise, options);
  }

  static online(options) {
    const promise = CoreSync.online();
    return wrapCallbacks(promise, options);
  }
}

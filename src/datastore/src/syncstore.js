import { CacheStore } from './cachestore';

/**
 * The SyncStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export class SyncStore extends CacheStore {
  get syncAutomatically() {
    return false;
  }
}

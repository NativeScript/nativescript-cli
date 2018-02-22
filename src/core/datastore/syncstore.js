import { CacheStore } from './cachestore';

import { processorFactory } from './processors';

/**
 * The SyncStore class is used to find, create, update, remove, count and group entities. Entities are stored
 * in a cache and synced with the backend.
 */
export class SyncStore extends CacheStore {
  constructor(collection, processor, options = {}) {
    const proc = processor || processorFactory.getOfflineProcessor();
    super(collection, proc, options);
  }
}

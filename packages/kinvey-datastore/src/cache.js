import { Cache } from 'kinvey-cache';
import { getConfig } from 'kinvey-app';

export class DataStoreCache extends Cache {
  constructor(collectionName, tag = '') {
    const { appKey } = getConfig();

    if (tag && !/^[a-zA-Z0-9-]+$/.test(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    if (tag) {
      super(`${appKey}.${tag}`, collectionName);
    } else {
      super(appKey, collectionName);
    }
  }
}

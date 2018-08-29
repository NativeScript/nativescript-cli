import Cache from '../cache';

export default class DataStoreCache extends Cache {
  constructor(appKey, collectionName, tag = '') {
    if (tag && !/^[a-zA-Z0-9-]+$/.test(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    super(`${appKey}${tag}`, collectionName);
  }
}

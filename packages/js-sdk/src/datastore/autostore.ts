import { Query } from '../query';
import { NetworkError } from '../errors/network';
import { Aggregation } from '../aggregation';
import { DataStoreCache } from './cache';
import { NetworkStore } from './networkstore';
import { CacheStore } from './cachestore';

export class AutoStore extends CacheStore {
  constructor(collectionName: string, options: any = { tag: undefined, useDeltaSet: false, useAutoPagination: false }) {
    super(collectionName, options);
  }

  async find(query?: Query, options: any = {}) {
    const cache = new DataStoreCache(this.collectionName, this.tag);

    try {
      await this.pull(query, options);
      return cache.find(query);
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.find(query);
      }

      throw error;
    }
  }

  async count(query?: Query, options: any = {}) {
    try {
      const network = new NetworkStore(this.collectionName);
      const count = await network.count(query, options);
      return count;
    } catch (error) {
      if (error instanceof NetworkError) {
        const cache = new DataStoreCache(this.collectionName, this.tag);
        return cache.count(query);
      }

      throw error;
    }
  }

  async group(aggregation: Aggregation, options: any = {}) {
    try {
      const network = new NetworkStore(this.collectionName);
      const result = await network.group(aggregation, options);
      return result;
    } catch (error) {
      if (error instanceof NetworkError) {
        const cache = new DataStoreCache(this.collectionName, this.tag);
        return cache.group(aggregation);
      }

      throw error;
    }
  }

  async findById(id: string, options: any = {}) {
    const cache = new DataStoreCache(this.collectionName, this.tag);

    try {
      const doc = await this.pullById(id, options);
      return doc;
    } catch (error) {
      if (error instanceof NetworkError) {
        return cache.findById(id);
      }

      throw error;
    }
  }
}

import { KinveyObservable } from 'kinvey-observable';
import { Query } from 'kinvey-query';
import { DataStoreCache } from './cache';
import { Sync } from './sync';
import { NetworkStore } from './networkstore';

export class CacheStore {
  constructor(appKey, collectionName, tag, options = { useDeltaSet: false, useAutoPagination: false, autoSync: true }) {
    this.appKey = appKey;
    this.collectionName = collectionName;
    this.tag = tag;
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination;
    this.autoSync = options.autoSync === true;
  }

  find(query, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cachedDocs = await cache.find(query);
        observer.next(cachedDocs);

        if (autoSync) {
          await this.pull(query, options);
          const docs = await cache.find(query);
          observer.next(docs);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  count(query, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cacheCount = await cache.count(query);
        observer.next(cacheCount);

        if (autoSync) {
          await this.pull(query, options);
          const count = await cache.count(query);
          observer.next(count);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  group(aggregation, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cacheResult = await cache.group(aggregation);
        observer.next(cacheResult);

        if (autoSync) {
          const network = new NetworkStore(this.appKey, this.collectionName);
          const networkResult = await network.group(aggregation).toPromise();
          observer.next(networkResult);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  findById(id, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const stream = KinveyObservable.create(async (observer) => {
      try {
        if (!id) {
          throw new Error('No id was provided. A valid id is required.');
        }

        const cachedDoc = await cache.findById(id);
        observer.next(cachedDoc);

        if (autoSync) {
          const query = new Query().equalTo('_id', id);
          await this.pull(query, options);
          const doc = await cache.findById(id);
          observer.next(doc);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  async create(doc, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    await sync.addCreateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      const pushResults = await this.push(query);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.entity;
    }

    return cachedDoc;
  }

  async update(doc, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    const cachedDoc = await cache.save(doc);
    await sync.addUpdateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      const pushResults = await this.push(query);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.entity;
    }

    return cachedDoc;
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    const docs = await cache.find(query);

    if (docs.length > 0) {
      let count = await cache.remove(query);
      const syncDocs = await sync.addDeleteSyncEvent(docs);

      if (syncDocs.length > 0 && autoSync) {
        const pushQuery = new Query().contains('_id', syncDocs.map(doc => doc._id));
        const pushResults = await this.push(pushQuery);
        count = pushResults.reduce((count, pushResult) => {
          if (pushResult.error) {
            return count - 1;
          }
          return count;
        }, count);
      }

      return count;
    }

    return 0;
  }

  async removeById(id, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    const doc = await cache.findById(id);

    if (doc) {
      let count = await cache.removeById(id);
      await sync.addDeleteSyncEvent(doc);

      if (autoSync) {
        const query = new Query().equalTo('_id', doc._id);
        const pushResults = await this.push(query);

        if (pushResults.length > 0) {
          const pushResult = pushResults.shift();
          if (pushResult.error) {
            count -= 1;
          }
        }
      }

      return count;
    }

    return 0;
  }

  async clear() {
    const cache = new DataStoreCache(this.appKey, this.collectionName, this.tag);
    await this.clearSync();
    return cache.clear();
  }

  async push(query) {
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    return sync.push(query);
  }

  async pull(query, options = {}) {
    const useDeltaSet = options.useDeltaSet === true || this.useDeltaSet;
    const useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination;
    const autoSync = options.autoSync === true || this.autoSync;
    const sync = new Sync(this.appKey, this.collectionName, this.tag);

    // Push sync queue
    const count = await sync.count();
    if (count > 0) {
      // TODO in newer version
      // if (autoSync) {
      //   await sync.push();
      //   return this.pull(query, Object.assign({ useDeltaSet, useAutoPagination, autoSync }, options));
      // }

      if (count === 1) {
        throw new Error(`Unable to pull entities from the backend. There is ${count} entity`
          + ' that needs to be pushed to the backend.');
      }

      throw new Error(`Unable to pull entities from the backend. There are ${count} entities`
        + ' that need to be pushed to the backend.');
    }

    // Delta Set
    if (useDeltaSet) {
      return sync.deltaset(query, Object.assign({ useDeltaSet, useAutoPagination, autoSync }, options));
    }

    // Auto Paginate
    if (useAutoPagination) {
      return sync.autopaginate(query, Object.assign({ useDeltaSet, useAutoPagination, autoSync }, options));
    }

    // Regular sync pull
    return sync.pull(query);
  }

  async sync(query, options) {
    const push = await this.push();
    const pull = await this.pull(query, options);
    return { push, pull };
  }

  pendingSyncDocs(query) {
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    return sync.find(query);
  }

  pendingSyncEntities(query) {
    return this.pendingSyncDocs(query);
  }

  pendingSyncCount(query) {
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    return sync.count(query);
  }

  clearSync(query) {
    const sync = new Sync(this.appKey, this.collectionName, this.tag);
    return sync.clear(query);
  }

  async subscribe(receiver) {
    const network = new NetworkStore(this.appKey, this.collectionName);
    await network.subscribe(receiver);
    return this;
  }

  async unsubscribe() {
    const network = new NetworkStore(this.appKey, this.collectionName);
    await network.unsubscribe();
    return this;
  }
}

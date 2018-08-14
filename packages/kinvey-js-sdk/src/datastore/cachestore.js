import isFunction from 'lodash/isFunction';
import Cache from '../cache';
import Query from '../query';
import Kmd from '../kmd';
import { KinveyHeaders, RequestMethod, formatKinveyBaasUrl, execute } from '../http';
import NetworkStore, { createRequest } from './networkstore';

const SYNC_CACHE_TAG = 'kinvey-sync';
const QUERY_CACHE_TAG = 'kinvey-query';
const PAGE_LIMIT = 10000;

const SyncEvent = {
  Create: 'Create',
  Update: 'Update',
  Delete: 'Delete'
};

class DataStoreCache extends Cache {
  constructor(appKey, name, tag) {
    let collectionName = name;

    if (tag) {
      if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
        throw new Error('A tag can only contain letters, numbers, and "-".');
      }
      collectionName = `${collectionName}.${tag}`;
    }

    super(appKey, collectionName);
  }
}

class SyncCache extends DataStoreCache {
  constructor(appKey, collectionName) {
    super(appKey, collectionName, SYNC_CACHE_TAG);
  }
}

class QueryCache extends DataStoreCache {
  constructor(appKey, collectionName) {
    super(appKey, collectionName, QUERY_CACHE_TAG);
  }

  updateWithResponse(doc, response) {
    const updatedDoc = doc;
    const headers = new KinveyHeaders(response.headers);
    updatedDoc.lastRequest = headers.requestStart;
    return this.save(updatedDoc);
  }
}

export default class CacheStore extends NetworkStore {
  constructor(appKey, collectionName, tag, options = { useDeltaSet: false, useAutoPagination: false, autoSync: false }) {
    super(appKey, collectionName);
    this.cache = new DataStoreCache(appKey, collectionName, tag);
    this.syncCache = new SyncCache(appKey, collectionName);
    this.queryCache = new QueryCache(appKey, collectionName);
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true;
    this.autoSync = options.autoSync === true;
  }

  async find(query, options = { autoSync: false, cacheCallback: () => {} }) {
    const { cacheCallback } = options;

    if (isFunction(cacheCallback)) {
      const cachedDocs = await this.cache.find(query);
      cacheCallback(cachedDocs);
    }

    await this.pull(query, options);
    return this.cache.find(query);
  }

  async count(query, options = { autoSync: false, cacheCallback: () => {} }) {
    const { cacheCallback } = options;

    if (isFunction(cacheCallback)) {
      const cacheCount = await this.cache.count(query);
      cacheCallback(cacheCount);
    }

    await this.pull(query, options);
    return this.cache.count(query);
  }

  async findById(id, options = { cacheCallback: () => {} }) {
    const { cacheCallback } = options;

    if (isFunction(cacheCallback)) {
      const cacheDoc = await this.cache.findById(id);
      cacheCallback(cacheDoc);
    }

    const query = new Query().equalTo('_id', id);
    await this.pull(query, options);
    return this.cache.findById(id);
  }

  async create(doc) {
    const cachedDoc = await this.cache.save(doc);
    await this.addCreateSyncEvent(cachedDoc);

    if (this.autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      await this.push(query);
    }

    return cachedDoc;
  }

  async update(doc) {
    const cachedDoc = await this.cache.save(doc);
    await this.addUpdateSyncEvent(cachedDoc);

    if (this.autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      await this.push(query);
    }

    return cachedDoc;
  }

  async remove(query) {
    // Find the docs in the cache
    const docs = await this.cache.find(query);

    if (docs.length > 0) {
      // Remove the docs from the cache
      await this.syncCache.remove(query);
      const count = await this.cache.remove(query);

      // Add delete events to the sync cache
      const syncDocs = await this.addDeleteSyncEvent(docs);

      if (syncDocs.length > 0 && this.autoSync) {
        // Push the sync events
        const pushQuery = new Query().contains('_id', syncDocs.map(doc => doc._id));
        const pushResults = await this.push(pushQuery);

        // Process push results
        return pushResults.reduce((count, pushResult) => {
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

  async removeById(id) {
    // Find the doc in the cache
    const doc = await this.cache.findById(id);

    if (doc) {
      // Remove the doc from the cache
      await this.syncCache.removeById(id);
      let count = await this.cache.removeById(id);

      // Add a delete event to the sync cache
      await this.addDeleteSyncEvent(doc);

      if (this.autoSync) {
        // Push the sync event
        const query = new Query().equalTo('_id', doc._id);
        const pushResults = await this.push(query);

        // Process push result
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
    await this.syncCache.clear();
    await this.queryCache.clear();
    return this.cache.clear();
  }

  async push() {
    const batchSize = 100;
    const syncDocs = await this.syncCache.find();

    if (syncDocs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults) => {
        if (i >= syncDocs.length) {
          return pushResults;
        }

        const batch = syncDocs.slice(i, i + batchSize);
        i += batchSize;

        const results = await Promise.all(batch.map(async (syncDoc) => {
          const { _id, state = { event: undefined } } = syncDoc;
          const { event } = state;

          if (event === SyncEvent.Delete) {
            try {
              // Remove the doc from the backend
              await super.removeById(_id);

              // Remove the sync doc
              await this.syncCache.removeById(_id);

              // Return a result
              return {
                _id,
                event
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id,
                event,
                error
              };
            }
          } else if (event === SyncEvent.Create || event === SyncEvent.Update) {
            try {
              let local = false;

              // Get the doc from the cache
              let doc = await this.cache.findById(_id);

              // Save the doc to the backend
              if (event === SyncEvent.Create) {
                const kmd = new Kmd(doc._kmd);

                if (kmd.isLocal()) {
                  local = true;
                  // tslint:disable-next-line:no-delete
                  delete doc._id;
                  // tslint:disable-next-line:no-delete
                  delete doc._kmd.local;
                }

                const response = await super.create(doc);
                doc = response.data;
              } else {
                const response = await super.update(doc);
                doc = response.data;
              }

              // Remove the sync doc
              await this.syncCache.removeById(_id);

              // Save the doc to cache
              await this.cache.save(doc);

              if (local) {
                // Remove the original doc that was created
                await this.cache.removeById(_id);
              }

              // Return a result
              return {
                _id,
                event,
                doc
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id,
                event,
                error
              };
            }
          }

          // Return a default result
          return {
            _id,
            event,
            error: new Error('Unable to push item in sync table because the event was not recognized.')
          };
        }));

        // Push remaining docs
        return batchPush(pushResults.concat(results));
      };

      return batchPush([]);
    }

    return [];
  }

  async pull(query, options = { useDeltaSet: false, useAutoPagination: false, autoSync: false }) {
    const { useDeltaSet = this.useDeltaSet, useAutoPagination = this.useAutoPagination, autoSync = this.autoSync } = options;
    const count = await this.syncCache.count(query);

    if (count > 0) {
      if (autoSync) {
        await this.push();
        return this.pull(query, { useDeltaSet, useAutoPagination, autoSync });
      }

      if (count === 1) {
        throw new Error(`Unable to pull docs from the backend. There is ${count} doc`
          + ' that needs to be pushed to the backend.');
      }

      throw new Error(`Unable to pull docs from the backend. There are ${count} docs`
        + ' that need to be pushed to the backend.');
    }

    const queryKey = query ? JSON.stringify(query.toQueryObject()) : '';
    const deltaSetQuery = new Query().equalTo('query', queryKey);
    let [cachedQuery] = await this.queryCache.find(deltaSetQuery);
    const since = cachedQuery ? cachedQuery.lastRequest : undefined;

    if (!cachedQuery) {
      cachedQuery = { collectionName: this.collectionName, query: queryKey };
    }

    if (useDeltaSet && since) {
      let queryObject = { since };

      // TODO: handle ParameterValueOutOfRangeError

      // Find with delta set

      if (query) {
        queryObject = Object.assign({}, query.toQueryObject(), queryObject);
      }

      const url = formatKinveyBaasUrl(`${this.pathname}/_deltaset`, queryObject);
      const request = createRequest(RequestMethod.GET, url);
      const response = await execute(request);
      const { changed, deleted } = response.data;

      // Update the query cache
      await this.queryCache.updateWithResponse(cachedQuery, response);

      // Delete the docs that have been deleted
      if (Array.isArray(deleted) && deleted.length > 0) {
        const removeQuery = new Query().contains('_id', deleted.map(doc => doc._id));
        await this.cache.remove(removeQuery);
      }

      // Save the docs that changed
      if (Array.isArray(changed) && changed.length > 0) {
        await this.cache.save(changed);
      }

      // Return the number of changed docs
      return changed.length;
    } else if (useAutoPagination) {
      const skip = 0;
      const limit = PAGE_LIMIT;
      let docs = [];

      // Get the total count of docs
      const response = await super.count(query);
      const count = 'count' in response.data ? response.data.count : Infinity;

      // Update the query cache
      await this.queryCache.updateWithResponse(cachedQuery, response);

      // Find the pages
      while (skip + limit < count) {
        const page = await this.findPage(query, skip, limit);
        docs = docs.concat(page);
      }

      // Update the cache
      await this.cache.save(docs);

      // Return the number of docs
      return docs.length;
    }

    // Find the docs on the backend
    const response = await super.find(query);
    const docs = response.data;

    // Update the query cache
    await this.queryCache.updateWithResponse(cachedQuery, response);

    // Update the cache
    await this.cache.save(docs);

    // Return the number of docs
    return docs.length;
  }

  async sync(query) {
    const push = await this.push();
    const pull = await this.pull(query);
    return { push, pull };
  }

  addCreateSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Create, docs);
  }

  addUpdateSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Update, docs);
  }

  addDeleteSyncEvent(docs) {
    return this.addSyncEvent(SyncEvent.Delete, docs);
  }

  async addSyncEvent(event, docs) {
    let singular = false;
    let syncDocs = [];

    if (!Array.isArray(docs)) {
      singular = true;
      docs = [docs];
    }

    if (docs.length > 0) {
      const docWithNoId = docs.find(doc => !doc._id);
      if (docWithNoId) {
        return Promise.reject(new Error('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.'));
      }

      if (event === SyncEvent.Delete) {
        docs = docs.filter((doc) => {
          if (doc._kmd) {
            return doc._kmd.local === false;
          }

          return true;
        });
      }

      const query = new Query().contains('_id', docs.map((doc) => doc._id));
      await this.remove(query);

      syncDocs = await this.syncCache.save(docs.map((doc) => {
        return {
          _id: doc._id,
          state: {
            event
          }
        };
      }));
    }

    return singular ? syncDocs[0] : syncDocs;
  }
}

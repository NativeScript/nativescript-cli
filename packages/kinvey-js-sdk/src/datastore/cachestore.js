import times from 'lodash/times';
import isNumber from 'lodash/isNumber';
import isEmpty from 'lodash/isEmpty';
import { KinveyObservable } from '../observable';
import Cache from '../cache';
import Query from '../query';
import Kmd from '../kmd';
import { RequestMethod, formatKinveyBaasUrl, execute } from '../http';
import { KinveyHeaders } from '../http/headers';
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
  constructor(appKey, collectionName, tag = '') {
    if (tag && !/^[a-zA-Z0-9-]+$/.test(tag)) {
      throw new Error('A tag can only contain letters, numbers, and "-".');
    }

    super(`${appKey}${tag}`, collectionName);
  }
}

class SyncCache extends DataStoreCache {
  constructor(appKey, collectionName, tag) {
    super(`${appKey}${SYNC_CACHE_TAG}`, collectionName, tag);
  }
}

class QueryCache extends DataStoreCache {
  constructor(appKey, collectionName, tag) {
    super(`${appKey}${QUERY_CACHE_TAG}`, collectionName, tag);
  }

  async findOrCreate(query = new Query()) {
    const queryObject = query.toQueryObject();
    const queryKey = queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
    const cachedQueries = await this.find(new Query().equalTo('query', queryKey));
    let queryCacheDoc = cachedQueries.shift();

    if (!queryCacheDoc) {
      queryCacheDoc = await this.save({ collectionName: this.collectionName, query: queryKey });
    }

    return queryCacheDoc;
  }
}

export default class CacheStore extends NetworkStore {
  constructor(appKey, collectionName, tag, options = { useDeltaSet: false, useAutoPagination: false, autoSync: true }) {
    super(appKey, collectionName);
    this.cache = new DataStoreCache(appKey, collectionName, tag);
    this.syncCache = new SyncCache(appKey, collectionName, tag);
    this.queryCache = new QueryCache(appKey, collectionName, tag);
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true || options.autoPagination === true;
    this.autoSync = options.autoSync === true;
  }

  find(query, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cachedDocs = await this.cache.find(query);
        observer.next(cachedDocs);

        if (autoSync) {
          await this.pull(query, options);
          const docs = await this.cache.find(query);
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
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cacheCount = await this.cache.count(query);
        observer.next(cacheCount);

        if (autoSync) {
          await this.pull(query, options);
          const count = await this.cache.count(query);
          observer.next(count);
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
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cachedDoc = await this.cache.findById(id);
        observer.next(cachedDoc);

        if (autoSync) {
          const query = new Query().equalTo('_id', id);
          await this.pull(query, options);
          const doc = await this.cache.findById(id);
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
    const cachedDoc = await this.cache.save(doc);
    await this.addCreateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      const pushResults = await this.push(query);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.doc;
    }

    return cachedDoc;
  }

  async update(doc, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const cachedDoc = await this.cache.save(doc);
    await this.addUpdateSyncEvent(cachedDoc);

    if (autoSync) {
      const query = new Query().equalTo('_id', cachedDoc._id);
      const pushResults = await this.push(query);
      const pushResult = pushResults.shift();

      if (pushResult.error) {
        throw pushResult.error;
      }

      return pushResult.doc;
    }

    return cachedDoc;
  }

  async remove(query, options = {}) {
    const autoSync = options.autoSync === true || this.autoSync;
    const docs = await this.cache.find(query);

    if (docs.length > 0) {
      await this.syncCache.remove(query);
      let count = await this.cache.remove(query);
      const syncDocs = await this.addDeleteSyncEvent(docs);

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
    const doc = await this.cache.findById(id);

    if (doc) {
      await this.syncCache.removeById(id);
      let count = await this.cache.removeById(id);
      await this.addDeleteSyncEvent(doc);

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
    await Promise.all([
      this.syncCache.clear(),
      this.queryCache.clear(),
      this.cache.clear()
    ]);
  }

  clearSync() {
    return this.syncCache.clear();
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
              await super.removeById(_id).toPromise();

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
                const kmd = new Kmd(doc);

                if (kmd.isLocal()) {
                  local = true;
                  // tslint:disable-next-line:no-delete
                  delete doc._id;
                  // tslint:disable-next-line:no-delete
                  delete doc._kmd.local;
                }

                doc = await super.create(doc).toPromise();
              } else {
                doc = await super.update(doc).toPromise();
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

  async pull(query, options = {}) {
    const useDeltaSet = options.useDeltaSet === true || this.useDeltaSet;
    const useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination;
    const autoSync = options.autoSync === true || this.autoSync;
    const count = await this.syncCache.count();
    let queryCacheDoc;

    if (count > 0) {
      if (autoSync) {
        await this.push();
        return this.pull(query, options);
      }

      if (count === 1) {
        throw new Error(`Unable to pull docs from the backend. There is ${count} doc`
          + ' that needs to be pushed to the backend.');
      }

      throw new Error(`Unable to pull docs from the backend. There are ${count} docs`
        + ' that need to be pushed to the backend.');
    }

    if (!query || (query && query.skip === 0 && query.limit === Infinity)) {
      queryCacheDoc = await this.queryCache.findOrCreate(query);

      if (useDeltaSet && queryCacheDoc.lastRequest) {
        let queryObject = { since: queryCacheDoc.lastRequest };

        // TODO: handle ParameterValueOutOfRangeError

        if (query) {
          queryObject = Object.assign({}, query.toQueryObject(), queryObject);
        }

        const url = formatKinveyBaasUrl(`${this.pathname}/_deltaset`, queryObject);
        const request = createRequest(RequestMethod.GET, url);
        const response = await execute(request);
        const { changed, deleted } = response.data;

        // Delete the docs that have been deleted
        if (Array.isArray(deleted) && deleted.length > 0) {
          const removeQuery = new Query().contains('_id', deleted.map(doc => doc._id));
          await this.cache.remove(removeQuery);
        }

        // Save the docs that changed
        if (Array.isArray(changed) && changed.length > 0) {
          await this.cache.save(changed);
        }

        // Update the query cache
        const headers = new KinveyHeaders(response.headers);
        queryCacheDoc.lastRequest = headers.requestStart;
        await this.queryCache.save(queryCacheDoc);

        // Return the number of changed docs
        return changed.length;
      }
    }

    if (useAutoPagination) {
      // Get the total count of docs
      const url = formatKinveyBaasUrl(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      const response = await execute(request);
      const count = 'count' in response.data ? response.data.count : Infinity;

      // Split query into pages
      const pageSize = options.autoPaginationPageSize || (options.autoPagination && options.autoPagination.pageSize) || PAGE_LIMIT;
      const pageCount = Math.ceil(count / pageSize);
      const pageQueries = times(pageCount, (i) => {
        const pageQuery = new Query(query);
        pageQuery.skip = i * pageSize;
        pageQuery.limit = Math.min(count - (i * pageSize), pageSize);
        return pageQuery;
      });

      // Process the pages
      const pagePromises = pageQueries.map((pageQuery) => {
        return super.find(pageQuery).toPromise()
          .then(docs => this.cache.save(docs))
          .then(docs => docs.length);
      });
      const pageCounts = await Promise.all(pagePromises);
      const totalPageCount = pageCounts.reduce((totalCount, pageCount) => totalCount + pageCount, 0);

      // Update the query cache
      if (useDeltaSet && queryCacheDoc) {
        const headers = new KinveyHeaders(response.headers);
        queryCacheDoc.lastRequest = headers.requestStart;
        await this.queryCache.save(queryCacheDoc);
      }

      // Return the number of docs
      return totalPageCount;
    }

    // Find the docs on the backend
    const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.GET, url);
    const response = await execute(request);
    const docs = response.data;

    // Update the query cache
    if (useDeltaSet && queryCacheDoc) {
      const headers = new KinveyHeaders(response.headers);
      queryCacheDoc.lastRequest = headers.requestStart;
      await this.queryCache.save(queryCacheDoc);
    }

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
          const kmd = new Kmd(doc);

          if (kmd.isLocal()) {
            return false;
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

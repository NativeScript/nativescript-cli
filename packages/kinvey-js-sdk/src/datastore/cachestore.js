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

  updateWithResponse(doc, response) {
    const updatedDoc = doc;
    const headers = new KinveyHeaders(response.headers);
    updatedDoc.lastRequest = headers.requestStart;
    return this.save(updatedDoc);
  }
}

export default class CacheStore extends NetworkStore {
  constructor(appKey, collectionName, tag, options = { useDeltaSet: false, useAutoPagination: false, autoSync: true }) {
    super(appKey, collectionName);
    this.cache = new DataStoreCache(appKey, collectionName, tag);
    this.syncCache = new SyncCache(appKey, collectionName, tag);
    this.queryCache = new QueryCache(appKey, collectionName, tag);
    this.useDeltaSet = options.useDeltaSet === true;
    this.useAutoPagination = options.useAutoPagination === true;
    this.autoSync = options.autoSync === true;
  }

  find(query, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
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

  count(query, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
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

  findById(id, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
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

  create(doc, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cachedDoc = await this.cache.save(doc);
        await this.addCreateSyncEvent(cachedDoc);
        observer.next(cachedDoc);

        if (autoSync) {
          const query = new Query().equalTo('_id', cachedDoc._id);
          const pull = await this.pull(query);
          const doc = pull.shift();
          observer.next(doc);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  update(doc, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
    const stream = KinveyObservable.create(async (observer) => {
      try {
        const cachedDoc = await this.cache.save(doc);
        await this.addUpdateSyncEvent(cachedDoc);
        observer.next(cachedDoc);

        if (autoSync) {
          const query = new Query().equalTo('_id', cachedDoc._id);
          const pull = await this.pull(query);
          const doc = pull.shift();
          observer.next(doc);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  remove(query, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
    const stream = KinveyObservable.create(async (observer) => {
      try {
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

          observer.next(count);
        } else {
          observer.next(0);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  removeById(id, options = { autoSync: this.autoSync }) {
    const { autoSync } = options;
    const stream = KinveyObservable.create(async (observer) => {
      try {
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

          observer.next(count);
        } else {
          observer.next(0);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
  }

  clear() {
    const stream = KinveyObservable.create(async (observer) => {
      try {
        await Promise.all([
          this.syncCache.clear(),
          this.queryCache.clear(),
          this.cache.clear()
        ]);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
    return stream;
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
      const url = formatKinveyBaasUrl(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
      const request = createRequest(RequestMethod.GET, url);
      const response = await execute(request);
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
    const url = formatKinveyBaasUrl(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(RequestMethod.GET, url);
    const response = await execute(request);
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

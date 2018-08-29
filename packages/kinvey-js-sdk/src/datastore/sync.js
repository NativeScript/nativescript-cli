import times from 'lodash/times';
import isEmpty from 'lodash/isEmpty';
import Kmd from '../kmd';
import Query from '../query';
import { execute, formatKinveyBaasUrl, KinveyRequest, RequestMethod, Auth } from '../http';
import { KinveyHeaders } from '../http/headers';
import NetworkStore from './networkstore';
import Cache from './cache';

const SYNC_CACHE_TAG = 'kinvey-sync';
const QUERY_CACHE_TAG = 'kinvey-query';
const PAGE_LIMIT = 10000;

const SyncEvent = {
  Create: 'POST',
  Update: 'PUT',
  Delete: 'DELETE'
};

function serializeQuery(query) {
  if (!query) {
    return '';
  }

  if (query.skip > 0 || query.limit < Infinity) {
    return null;
  }

  const queryObject = query.toQueryObject();
  return queryObject && !isEmpty(queryObject) ? JSON.stringify(queryObject) : '';
}

class SyncCache extends Cache {
  constructor(appKey, collectionName, tag) {
    super(`${appKey}${SYNC_CACHE_TAG}`, collectionName, tag);
  }
}

class QueryCache extends Cache {
  constructor(appKey, collectionName, tag) {
    super(`${appKey}${QUERY_CACHE_TAG}`, collectionName, tag);
  }

  async findByKey(key) {
    const query = new Query().equalTo('query', key);
    const docs = await this.find(query);
    return docs.shift();
  }

  async save(query, response) {
    const key = serializeQuery(query);

    if (key !== null) {
      const headers = new KinveyHeaders(response.headers);
      let doc = await this.findByKey(key);

      if (!doc) {
        doc = { collectionName: this.collectionName, query: key }
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }
}

export default class Sync {
  constructor(appKey, collectionName, tag) {
    this.appKey = appKey;
    this.collectionName = collectionName;
    this.tag = tag;
  }

  find(query) {
    const syncCache = new SyncCache(this.appKey, this.collectionName, this.tag);
    return syncCache.find(query);
  }


  count(query) {
    const syncCache = new SyncCache(this.appKey, this.collectionName, this.tag);
    return syncCache.count(query);
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
    const syncCache = new SyncCache(this.appKey, this.collectionName, this.tag);
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
          const kmd = new Kmd(doc._kmd);

          if (kmd.isLocal()) {
            return false;
          }

          return true;
        });
      }

      const query = new Query().contains('_id', docs.map((doc) => doc._id));
      await syncCache.remove(query);

      syncDocs = await syncCache.save(docs.map((doc) => {
        return {
          _id: doc._id,
          entityId: doc._id,
          collection: this.collectionName,
          state: {
            operation: event
          }
        };
      }));
    }

    return singular ? syncDocs[0] : syncDocs;
  }

  async push(query) {
    const network = new NetworkStore(this.appKey, this.collectionName);
    const cache = new Cache(this.appKey, this.collectionName, this.tag);
    const syncCache = new SyncCache(this.appKey, this.collectionName, this.tag);
    const batchSize = 100;
    const syncDocs = await syncCache.find(query);

    if (syncDocs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults) => {
        if (i >= syncDocs.length) {
          return pushResults;
        }

        const batch = syncDocs.slice(i, i + batchSize);
        i += batchSize;

        const results = await Promise.all(batch.map(async (syncDoc) => {
          const { _id, state = { operation: undefined } } = syncDoc;
          const event = state.operation;

          if (event === SyncEvent.Delete) {
            try {
              // Remove the doc from the backend
              await network.removeById(_id);

              // Remove the sync doc
              await syncCache.removeById(_id);

              // Return a result
              return {
                _id,
                operation: event
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id,
                operation: event,
                error
              };
            }
          } else if (event === SyncEvent.Create || event === SyncEvent.Update) {
            try {
              let local = false;

              // Get the doc from the cache
              let doc = await cache.findById(_id);

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

                doc = await network.create(doc);
              } else {
                doc = await network.update(doc);
              }

              // Remove the sync doc
              await syncCache.removeById(_id);

              // Save the doc to cache
              await cache.save(doc);

              if (local) {
                // Remove the original doc that was created
                await cache.removeById(_id);
              }

              // Return a result
              return {
                _id,
                operation: event,
                entity: doc
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id,
                operation: event,
                error
              };
            }
          }

          // Return a default result
          return {
            _id,
            operation: event,
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

  async pull(query) {
    const network = new NetworkStore(this.appKey, this.collectionName);
    const cache = new Cache(this.appKey, this.collectionName, this.tag);
    const queryCache = new QueryCache(this.appKey, this.collectionName, this.tag);

    // Find the docs on the backend
    const response = await network.find(query, true).toPromise();
    const docs = response.data;

    // Update the cache
    await cache.save(docs);

    // Update the query cache
    queryCache.save(query, response);

    // Return the number of docs
    return docs.length;
  }

  async deltaset(query, options = {}) {
    const useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination;

    if (!query || (query.skip === 0 && query.limit === Infinity)) {
      try {
        const cache = new Cache(this.appKey, this.collectionName, this.tag);
        const queryCache = new QueryCache(this.appKey, this.collectionName, this.tag);
        const key = serializeQuery(query);
        const queryCacheDoc = await queryCache.findByKey(key);

        if (queryCacheDoc && queryCacheDoc.lastRequest) {
          let queryObject = { since: queryCacheDoc.lastRequest };

          if (query) {
            queryObject = Object.assign({}, query.toQueryObject(), queryObject);
          }

          // Delta Set request
          const url = formatKinveyBaasUrl(`/appdata/${this.appKey}/${this.collectionName}/_deltaset`, queryObject);
          const request = new KinveyRequest({ method: RequestMethod.GET, auth: Auth.Session, url });
          const response = await execute(request);
          const { changed, deleted } = response.data;

          // Delete the docs that have been deleted
          if (Array.isArray(deleted) && deleted.length > 0) {
            const removeQuery = new Query().contains('_id', deleted.map(doc => doc._id));
            await cache.remove(removeQuery);
          }

          // Save the docs that changed
          if (Array.isArray(changed) && changed.length > 0) {
            await cache.save(changed);
          }

          // Update the query cache
          await queryCache.save(query, response);

          // Return the number of changed docs
          return changed.length;
        }
      } catch (error) {
        if (error.name !== 'MissingConfiguration' && error.name !== 'ParameterValueOutOfRange') {
          throw error;
        }
      }
    }

    if (useAutoPagination) {
      return this.autopaginate(query, options);
    }

    return this.pull(query);
  }

  async autopaginate(query, options = {}) {
    const network = new NetworkStore(this.appKey, this.collectionName);
    const cache = new Cache(this.appKey, this.collectionName, this.tag);
    const queryCache = new QueryCache(this.appKey, this.collectionName, this.tag);

    // Clear the cache
    await cache.clear();

    // Get the total count of docs
    const response = await network.count(query, true).toPromise();
    const count = 'count' in response.data ? response.data.count : Infinity;

    // Create the pages
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
      return network.find(pageQuery).toPromise()
        .then(docs => cache.save(docs))
        .then(docs => docs.length);
    });
    const pageCounts = await Promise.all(pagePromises);
    const totalPageCount = pageCounts.reduce((totalCount, pageCount) => totalCount + pageCount, 0);

    // Update the query cache
    queryCache.save(query, response);

    // Return the total page count
    return totalPageCount;
  }

  clear(query) {
    const syncCache = new SyncCache(this.appKey, this.collectionName, this.tag);
    if (query) {
      return syncCache.remove(query);
    }
    return syncCache.clear();
  }
}

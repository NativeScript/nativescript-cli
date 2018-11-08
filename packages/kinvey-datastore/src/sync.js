import times from 'lodash/times';
import isEmpty from 'lodash/isEmpty';
import { Query } from 'kinvey-query';
import { formatKinveyUrl, KinveyRequest, RequestMethod, Auth, KinveyHeaders } from 'kinvey-http';
import { get as getSession } from 'kinvey-session';
import { getConfig } from 'kinvey-app';
import { MissingConfigurationError, ParameterValueOutOfRangeError, SyncError } from 'kinvey-errors';
import { NetworkStore } from './networkstore';
import { DataStoreCache } from './cache';

const SYNC_CACHE_TAG = 'kinvey-sync';
const QUERY_CACHE_TAG = 'kinvey-query';
const PAGE_LIMIT = 10000;
const PUSH_IN_PROGRESS = {};

function isPushInProgress(collectionName) {
  return PUSH_IN_PROGRESS[collectionName] === true;
}

function markPushStart(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = true;
}

function markPushEnd(collectionName) {
  PUSH_IN_PROGRESS[collectionName] = false;
}

export const SyncEvent = {
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

class SyncCache extends DataStoreCache {
  constructor(collectionName, tag) {
    if (tag) {
      super(collectionName, `${SYNC_CACHE_TAG}-${tag}`);
    } else {
      super(collectionName, SYNC_CACHE_TAG);
    }
  }
}

class QueryCache extends DataStoreCache {
  constructor(collectionName, tag) {
    if (tag) {
      super(collectionName, `${QUERY_CACHE_TAG}-${tag}`);
    } else {
      super(collectionName, QUERY_CACHE_TAG);
    }
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
        doc = { collectionName: this.collectionName, query: key };
      }

      doc.lastRequest = headers.requestStart;
      return super.save(doc);
    }

    return null;
  }
}

export class Sync {
  constructor(collectionName, tag) {
    this.collectionName = collectionName;
    this.tag = tag;
  }

  find(query) {
    const syncCache = new SyncCache(this.collectionName, this.tag);
    return syncCache.find(query);
  }


  count(query) {
    const syncCache = new SyncCache(this.collectionName, this.tag);
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
    const syncCache = new SyncCache(this.collectionName, this.tag);
    let singular = false;
    let syncDocs = [];

    if (!Array.isArray(docs)) {
      singular = true;
      docs = [docs];
    }

    if (docs.length > 0) {
      const docWithNoId = docs.find(doc => !doc._id);
      if (docWithNoId) {
        throw new SyncError('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.');
      }

      // Remove existing sync events that match the docs
      const query = new Query().contains('_id', docs.map(doc => doc._id));
      await this.remove(query);

      // Don't add delete events for docs that were created offline
      if (event === SyncEvent.Delete) {
        docs = docs.filter((doc) => {
          if (doc._kmd && doc._kmd.local === true) {
            return false;
          }

          return true;
        });
      }

      // Add sync events for the docs
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

    return singular ? syncDocs.shift() : syncDocs;
  }

  async push(query, options) {
    if (isPushInProgress(this.collectionName)) {
      throw new SyncError('Data is already being pushed to the backend. Please wait for it to complete before pushing new data to the backend.');
    }

    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const syncCache = new SyncCache(this.collectionName, this.tag);
    const batchSize = 100;
    const syncDocs = await syncCache.find(query);

    if (syncDocs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults) => {
        markPushStart(this.collectionName);

        if (i >= syncDocs.length) {
          markPushEnd(this.collectionName);
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
              await network.removeById(_id, options);

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
            let doc = await cache.findById(_id);
            let local = false;

            try {
              // Save the doc to the backend
              if (event === SyncEvent.Create) {
                if (doc._kmd && doc._kmd.local === true) {
                  local = true;
                  // tslint:disable-next-line:no-delete
                  delete doc._id;
                  // tslint:disable-next-line:no-delete
                  delete doc._kmd.local;
                }

                doc = await network.create(doc, options);
              } else {
                doc = await network.update(doc, options);
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
                entity: doc,
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

        markPushEnd(this.collectionName);

        // Push remaining docs
        return batchPush(pushResults.concat(results));
      };

      return batchPush([]);
    }

    return [];
  }

  async pull(query, options = {}) {
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.collectionName, this.tag);

    // Find the docs on the backend
    const response = await network.find(query, Object.assign({}, options, { rawResponse: true })).toPromise();
    const docs = response.data;

    // Clear the cache if a query was not provided
    if (!query) {
      await cache.clear();
    }

    // Update the cache
    await cache.save(docs);

    // Update the query cache
    await queryCache.save(query, response);

    // Return the number of docs
    return docs.length;
  }

  async deltaset(query, options = {}) {
    const useAutoPagination = options.useAutoPagination === true || options.autoPagination || this.useAutoPagination;

    if (!query || (query.skip === 0 && query.limit === Infinity)) {
      try {
        const cache = new DataStoreCache(this.collectionName, this.tag);
        const queryCache = new QueryCache(this.collectionName, this.tag);
        const key = serializeQuery(query);
        const queryCacheDoc = await queryCache.findByKey(key);

        if (queryCacheDoc && queryCacheDoc.lastRequest) {
          let queryObject = { since: queryCacheDoc.lastRequest };

          if (query) {
            queryObject = Object.assign({}, query.toQueryObject(), queryObject);
          }

          // Delta Set request
          const { api, appKey } = getConfig();
          const url = formatKinveyUrl(api.protocol, api.host, `/appdata/${appKey}/${this.collectionName}/_deltaset`, queryObject);
          const request = new KinveyRequest({ method: RequestMethod.GET, headers: { Authorization: Auth.Session(getSession()) }, url });
          const response = await request.execute();
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
        if (!(error instanceof MissingConfigurationError) && !(error instanceof ParameterValueOutOfRangeError)) {
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
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const queryCache = new QueryCache(this.collectionName, this.tag);

    // Clear the cache
    await cache.clear();

    // Get the total count of docs
    const response = await network.count(query, Object.assign({}, options, { rawResponse: true })).toPromise();
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
      return network.find(pageQuery, options).toPromise()
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

  async remove(query) {
    // Clear the query cache
    if (!query) {
      const queryCache = new QueryCache(this.collectionName, this.tag);
      await queryCache.remove();
    }

    const syncCache = new SyncCache(this.collectionName, this.tag);
    return syncCache.remove(query);
  }

  async removeById(id) {
    const syncCache = new SyncCache(this.collectionName, this.tag);
    return syncCache.removeById(id);
  }

  async clear() {
    // Clear the query cache
    const queryCache = new QueryCache(this.collectionName, this.tag);
    await queryCache.remove();

    // Clear the sync cache
    const syncCache = new SyncCache(this.collectionName, this.tag);
    return syncCache.remove();
  }
}
